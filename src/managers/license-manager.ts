import * as vscode from 'vscode';
import {type Disposable, type TextDocument} from 'vscode';

import {ERROR_MESSAGES} from '../constants';
import {tryCatch} from '../handlers';
import {error} from '../loggers';
import {LicenseService} from '../services';
import {
  type IConfigService,
  type IFileService,
  type ITemplateService,
} from '../services/interfaces';
import {
  STANDARD_LICENSE_TYPES,
  type ExtractedLicense,
  type LicenseTemplate,
  type LicenseType,
  type Result,
} from '../types';
import {type ILicenseManager} from './interfaces';

/**
 * Debounce window applied to save events before auto-processing the document.
 * Avoids running the expensive license pipeline on every keystroke-triggered save.
 */
const AUTO_SAVE_DEBOUNCE_MS = 500;

/**
 * Minimum gap between two auto-correction writes. Prevents a feedback loop
 * where our own save event re-triggers correction before VSCode has settled.
 */
const AUTO_CORRECTION_COOLDOWN_MS = 5000;

/**
 * Below this length the extracted comment is almost certainly a plain header,
 * not a license body. Skipping avoids false-positive "typo" corrections.
 */
const MIN_LICENSE_BODY_LENGTH = 50;

const DEFAULT_LICENSE_FALLBACK: LicenseType = 'mit';

export class LicenseManager implements ILicenseManager {
  private autoSaveDisposable: Disposable | undefined;
  private autoSaveDebounceTimer: NodeJS.Timeout | undefined;
  private autoSaveInFlight: Promise<void> | undefined;
  private isAutoCorrecting = false;
  private lastAutoCorrectionTime = 0;

  constructor(
    private readonly configurationService: IConfigService,
    private readonly templateService: ITemplateService,
    private readonly fileService: IFileService,
  ) {}

  async start(): Promise<void> {
    // Reserved for future asynchronous initialization.
  }

  async stop(): Promise<void> {
    this.teardownAutoSave();
  }

  async enableAutoSave(): Promise<Result<void, Error>> {
    this.teardownAutoSave();

    this.autoSaveDisposable = vscode.workspace.onDidSaveTextDocument(document =>
      this.scheduleAutoSave(document),
    );

    const [, updateError] = await tryCatch(
      this.configurationService.updateAutoAddEnabled(true),
    );
    if (updateError) {
      return [null, updateError];
    }
    return [undefined, null];
  }

  async disableAutoSave(): Promise<void> {
    this.teardownAutoSave();
    await this.configurationService.updateAutoAddEnabled(false);
  }

  async enableAutoCorrect(): Promise<Result<void, Error>> {
    const [, updateError] = await tryCatch(
      this.configurationService.updateAutoCorrect(true),
    );
    if (updateError) {
      return [null, updateError];
    }
    return [undefined, null];
  }

  async disableAutoCorrect(): Promise<Result<void, Error>> {
    const [, updateError] = await tryCatch(
      this.configurationService.updateAutoCorrect(false),
    );
    if (updateError) {
      return [null, updateError];
    }
    return [undefined, null];
  }

  async addLicenseToFile(
    licenseType?: LicenseType,
  ): Promise<Result<boolean, Error>> {
    const licenseTypeToUse =
      licenseType ?? this.configurationService.defaultLicense.name;

    if (!licenseTypeToUse) {
      error('License manager: No license type found in configuration');
      return [null, new Error(ERROR_MESSAGES.NO_LICENSE_TYPE)];
    }

    const [availableLicenses, availableError] = await this.availableLicenses();
    if (availableError) {
      return [null, availableError];
    }
    if (!availableLicenses.includes(licenseTypeToUse)) {
      return [
        null,
        new Error(
          `License type "${licenseTypeToUse}" is not available. ` +
            `Available types: ${availableLicenses.join(', ')}`,
        ),
      ];
    }

    const [formatted, formatError] =
      await this.buildFormattedLicense(licenseTypeToUse);
    if (formatError) {
      return [null, formatError];
    }

    return this.fileService.insertIntoFile(formatted);
  }

  async availableLicenses(): Promise<Result<string[], Error>> {
    const customTemplates = this.templateService.allCustomTemplates;
    const customLicenseNames = customTemplates.map(template => template.name);
    return [[...STANDARD_LICENSE_TYPES, ...customLicenseNames], null];
  }

  get defaultLicense(): LicenseTemplate {
    return this.configurationService.defaultLicense;
  }

  get isAutoSaveEnabled(): boolean {
    return this.configurationService.isAutoAddEnabled;
  }

  get isAutoCorrectEnabled(): boolean {
    return this.configurationService.isAutoCorrectEnabled;
  }

  private scheduleAutoSave(document: TextDocument): void {
    if (this.autoSaveInFlight || this.isAutoCorrecting) {
      return;
    }
    if (!this.isAutoSaveEnabled || !this.fileService.shouldProcessFile()) {
      return;
    }

    if (this.autoSaveDebounceTimer) {
      clearTimeout(this.autoSaveDebounceTimer);
    }
    this.autoSaveDebounceTimer = setTimeout(() => {
      this.autoSaveDebounceTimer = undefined;
      this.autoSaveInFlight = this.processAutoSave(document).finally(() => {
        this.autoSaveInFlight = undefined;
      });
    }, AUTO_SAVE_DEBOUNCE_MS);
  }

  private async processAutoSave(document: TextDocument): Promise<void> {
    const [hasLicense, hasLicenseError] = await this.fileService.hasLicense();
    if (hasLicenseError) {
      error(
        `Auto-save failed: Error checking for license in ${document.fileName}: ${hasLicenseError.message}`,
      );
      return;
    }

    if (!hasLicense) {
      const [, addError] = await this.addLicenseToFile();
      if (addError) {
        error(
          `Auto-save failed: Error adding license to ${document.fileName}: ${addError.message}`,
        );
      }
      return;
    }

    const extractedLicense = this.fileService.extractLicense(
      document.getText(),
    );
    if (!extractedLicense) {
      return;
    }

    const licenseTypeToUse = this.resolveDefaultLicenseType();
    const [template, templateError] =
      await this.templateService.getTemplate(licenseTypeToUse);
    if (templateError) {
      error(
        `Auto-save failed: Error getting template for ${document.fileName}: ${templateError.message}`,
      );
      return;
    }

    const [processedTemplate, processError] =
      await this.templateService.processTemplate(template);
    if (processError) {
      error(
        `Auto-save failed: Error processing template for ${document.fileName}: ${processError.message}`,
      );
      return;
    }

    const licenseService = new LicenseService(this.fileService.language, '');
    const cleanedExtractedContent = licenseService.extractLicenseFromContent(
      extractedLicense.content,
    );
    if (cleanedExtractedContent.length < MIN_LICENSE_BODY_LENGTH) {
      return;
    }

    const [hasTypo, typoError] = await this.fileService.hasTypo(
      cleanedExtractedContent,
      processedTemplate.content,
    );
    if (typoError) {
      error(
        `Auto-save failed: Error checking for typos in ${document.fileName}: ${typoError.message}`,
      );
      return;
    }
    if (!hasTypo || !this.isAutoCorrectEnabled) {
      return;
    }

    const now = Date.now();
    if (now - this.lastAutoCorrectionTime < AUTO_CORRECTION_COOLDOWN_MS) {
      return;
    }
    this.lastAutoCorrectionTime = now;

    const [, correctionError] = await this.correctLicense(extractedLicense);
    if (correctionError) {
      error(
        `Auto-save failed: Correction error in ${document.fileName}: ${correctionError.message}`,
      );
    }
  }

  private async correctLicense(
    extractedLicense: ExtractedLicense,
  ): Promise<Result<boolean, Error>> {
    this.isAutoCorrecting = true;
    try {
      const licenseTypeToUse = this.resolveDefaultLicenseType();
      const [formatted, formatError] =
        await this.buildFormattedLicense(licenseTypeToUse);
      if (formatError) {
        return [null, formatError];
      }
      return this.fileService.replaceLicense(extractedLicense, formatted);
    } finally {
      this.isAutoCorrecting = false;
    }
  }

  private async buildFormattedLicense(
    licenseType: LicenseType,
  ): Promise<Result<string, Error>> {
    const [template, templateError] =
      await this.templateService.getTemplate(licenseType);
    if (templateError) {
      return [null, templateError];
    }

    const [processedTemplate, processError] =
      await this.templateService.processTemplate(template);
    if (processError) {
      error(
        `License manager: Template processing failed: ${processError.message}`,
      );
      return [null, processError];
    }

    if (!processedTemplate.content.trim()) {
      const msg = 'Processed template content is empty';
      error(`License manager: ${msg}`);
      return [null, new Error(msg)];
    }

    const licenseService = new LicenseService(
      this.fileService.language,
      processedTemplate.content,
    );
    const formatted =
      this.fileService.commentStyle.type === 'line'
        ? licenseService.formatLineLicense()
        : licenseService.formatBlockLicense();
    return [formatted, null];
  }

  private resolveDefaultLicenseType(): LicenseType {
    const {name} = this.configurationService.defaultLicense;
    return typeof name === 'string' && name.length > 0
      ? name
      : DEFAULT_LICENSE_FALLBACK;
  }

  private teardownAutoSave(): void {
    if (this.autoSaveDisposable) {
      this.autoSaveDisposable.dispose();
      this.autoSaveDisposable = undefined;
    }
    if (this.autoSaveDebounceTimer) {
      clearTimeout(this.autoSaveDebounceTimer);
      this.autoSaveDebounceTimer = undefined;
    }
  }
}
