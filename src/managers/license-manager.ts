import * as vscode from "vscode";

import { Disposable, TextDocument } from "vscode";
import { ERROR_MESSAGES, STANDARD_LICENSES, UI_MESSAGES } from "../constants";
import { error, info } from "../loggers";
import { LicenseService } from "../services";
import {
	IConfigService,
	IFileService,
	ITemplateService,
} from "../services/interfaces";
import { LicenseTemplate, LicenseType } from "../types";
import { ILicenseManager } from "./interfaces";

export class LicenseManager implements ILicenseManager {
	private readonly configurationService: IConfigService;
	private readonly templateService: ITemplateService;
	private readonly fileService: IFileService;
	private autoSaveDisposable: Disposable | undefined;
	private autoSaveDebounceTimer: NodeJS.Timeout | undefined;
	private isProcessingAutoSave: boolean = false;

	constructor(
		configurationService: IConfigService,
		templateService: ITemplateService,
		fileService: IFileService
	) {
		this.configurationService = configurationService;
		this.templateService = templateService;
		this.fileService = fileService;
	}

	start(): Promise<void> {
		return Promise.resolve();
	}

	stop(): Promise<void> {
		if (this.autoSaveDisposable) {
			this.autoSaveDisposable.dispose();
			this.autoSaveDisposable = undefined;
		}
		if (this.autoSaveDebounceTimer) {
			clearTimeout(this.autoSaveDebounceTimer);
			this.autoSaveDebounceTimer = undefined;
		}
		return Promise.resolve();
	}

	async enableAutoSave(): Promise<Result<void, Error>> {
		if (this.autoSaveDisposable !== undefined) {
			this.autoSaveDisposable.dispose();
		}

		this.autoSaveDisposable = vscode.workspace.onDidSaveTextDocument(
			async (document) => {
				if (this.isProcessingAutoSave) {
					return;
				}

				if (this.autoSaveDebounceTimer) {
					clearTimeout(this.autoSaveDebounceTimer);
				}

				if (
					!this.isAutoSaveEnabled ||
					!this.fileService.shouldProcessFile()
				) {
					return;
				}

				this.autoSaveDebounceTimer = setTimeout(
					() => this.processAutoSave(document),
					100
				);
			}
		);

		const [updateResult, updateError] = await tryCatch(
			this.configurationService.updateAutoAddEnabled(true)
		);

		if (updateError) {
			return [null, updateError];
		}

		return [updateResult, null];
	}

	private async processAutoSave(document: TextDocument): Promise<void> {
		this.isProcessingAutoSave = true;

		const [hasLicense, hasLicenseError] =
			await this.fileService.hasLicense();

		if (hasLicense === true || hasLicenseError) {
			this.isProcessingAutoSave = false;
			return;
		}

		const [success, addLicenseError] = await this.addLicenseToFile();

		if (addLicenseError) {
			error(addLicenseError.message);
			this.isProcessingAutoSave = false;
			return;
		}

		if (success === true) {
			const msg = `${UI_MESSAGES.AUTO_ADDED_LICENSE} ${document.fileName}`;
			info(msg);
		}

		this.isProcessingAutoSave = false;
	}

	public disableAutoSave(): Promise<void> {
		if (this.autoSaveDisposable) {
			this.autoSaveDisposable.dispose();
			this.autoSaveDisposable = undefined;
		}
		if (this.autoSaveDebounceTimer) {
			clearTimeout(this.autoSaveDebounceTimer);
			this.autoSaveDebounceTimer = undefined;
		}

		this.isProcessingAutoSave = false;

		return this.configurationService.updateAutoAddEnabled(false);
	}

	public async addLicenseToFile(
		licenseType?: LicenseType
	): Promise<Result<boolean, Error>> {
		const licenseTypeToUse =
			licenseType || this.configurationService.defaultLicense.name;

		if (licenseTypeToUse === undefined) {
			return [null, new Error(ERROR_MESSAGES.NO_LICENSE_TYPE)];
		}

		const [template, hasTemplateError] =
			await this.templateService.getTemplate(licenseTypeToUse);

		if (hasTemplateError) {
			return [null, hasTemplateError];
		}

		const [processedTemplate, hasProcessedTemplateError] =
			await this.templateService.processTemplate(template);

		if (hasProcessedTemplateError) {
			return [null, hasProcessedTemplateError];
		}

		const licenseService = new LicenseService(
			this.fileService.language,
			processedTemplate.content
		);

		const [result, resultError] = await this.fileService.insertIntoFile(
			this.fileService.commentStyle.type === "line"
				? licenseService.formatLineLicense()
				: licenseService.formatBlockLicense()
		);

		if (resultError) {
			return [null, resultError];
		}

		return [result, null];
	}

	async availableLicenses(): Promise<Result<string[], Error>> {
		const customTemplates = this.templateService.allCustomTemplates;
		const customLicenseNames = customTemplates.map(
			(template) => template.name
		);
		return [[...STANDARD_LICENSES, ...customLicenseNames], null];
	}

	public get defaultLicense(): LicenseTemplate {
		return this.configurationService.defaultLicense;
	}

	public get isAutoSaveEnabled(): boolean {
		return this.configurationService.isAutoAddEnabled;
	}

	public get isAutoCorrectEnabled(): boolean {
		return this.configurationService.isAutoCorrectEnabled;
	}
}
