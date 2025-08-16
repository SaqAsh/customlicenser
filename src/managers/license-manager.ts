import * as vscode from "vscode";

import { Disposable, TextDocument } from "vscode";
import { ERROR_MESSAGES, STANDARD_LICENSES } from "../constants";
import { error } from "../loggers";
import { LicenseService } from "../services";
import {
	IConfigService,
	IFileService,
	ITemplateService,
} from "../services/interfaces";
import { ExtractedLicense, LicenseTemplate, LicenseType } from "../types";
import { ILicenseManager } from "./interfaces";

export class LicenseManager implements ILicenseManager {
	private readonly configurationService: IConfigService;
	private readonly templateService: ITemplateService;
	private readonly fileService: IFileService;
	private autoSaveDisposable: Disposable | undefined;
	private autoSaveDebounceTimer: NodeJS.Timeout | undefined;
	private isProcessingAutoSave: boolean = false;
	private isAutoCorrecting: boolean = false;
	private lastAutoCorrectionTime: number = 0;
	private readonly AUTO_CORRECTION_COOLDOWN = 5000;
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
				if (this.isProcessingAutoSave || this.isAutoCorrecting) {
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
					500
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
		// Prevent infinite loops by checking if we're already processing
		if (this.isProcessingAutoSave) {
			return;
		}

		this.isProcessingAutoSave = true;

		const [hasLicense, hasLicenseError] =
			await this.fileService.hasLicense();

		if (hasLicenseError) {
			error(
				`Auto-save failed: Error checking for license in ${document.fileName}: ${hasLicenseError.message}`
			);
			this.isProcessingAutoSave = false;
			return;
		}
		if (hasLicense) {
			const extractedLicense = this.fileService.extractLicense(
				document.getText()
			);
			if (extractedLicense) {
				// Get the raw template content for comparison (not formatted)
				const licenseTypeToUse =
					this.configurationService.defaultLicense.name;
				const [template, templateError] =
					await this.templateService.getTemplate(licenseTypeToUse);

				if (templateError) {
					error(
						`Auto-save failed: Error getting template for ${document.fileName}: ${templateError.message}`
					);
					this.isProcessingAutoSave = false;
					return;
				}

				const [processedTemplate, processedTemplateError] =
					await this.templateService.processTemplate(template);

				if (processedTemplateError) {
					error(
						`Auto-save failed: Error processing template for ${document.fileName}: ${processedTemplateError.message}`
					);
					this.isProcessingAutoSave = false;
					return;
				}

				// Extract and clean the license content to get raw text
				const licenseService = new LicenseService(
					this.fileService.language,
					""
				);
				const cleanedExtractedContent =
					licenseService.extractLicenseFromContent(
						extractedLicense.content
					);

				const [hasTypo, hasTypoError] = await this.fileService.hasTypo(
					cleanedExtractedContent,
					processedTemplate.content // Compare with raw processed template, not formatted
				);

				if (hasTypoError) {
					error(
						`Auto-save failed: Error checking for typos in ${document.fileName}: ${hasTypoError.message}`
					);
					this.isProcessingAutoSave = false;
					return;
				}

				if (!hasTypo) {
					// License is correct, no need to process
					this.isProcessingAutoSave = false;
					return;
				}

				// License has typos, check if auto-correct is enabled
				if (this.isAutoCorrectEnabled) {
					// Check cooldown period to prevent rapid corrections
					const now = Date.now();
					const timeSinceLastCorrection =
						now - this.lastAutoCorrectionTime;

					if (
						timeSinceLastCorrection < this.AUTO_CORRECTION_COOLDOWN
					) {
						this.isProcessingAutoSave = false;
						return;
					}

					// 🔥 CRITICAL: Set isAutoCorrecting flag and update last correction time
					this.isAutoCorrecting = true;
					this.lastAutoCorrectionTime = now;
					const [success, correctionError] =
						await this.correctLicense(extractedLicense);

					if (correctionError) {
						error(correctionError.message);
						this.isProcessingAutoSave = false;
						this.isAutoCorrecting = false;
						return;
					}

					if (success) {
						// Success but don't show info message during auto-save
					}

					this.isProcessingAutoSave = false;
					this.isAutoCorrecting = false;
					return;
				} else {
					// Auto-correct is disabled, but license has typos
					// Don't add a new license, just silently skip
					this.isProcessingAutoSave = false;
					return;
				}
			}
		}

		// Only add license if no license exists
		const [success, addLicenseError] = await this.addLicenseToFile();

		if (addLicenseError) {
			error(
				`Auto-save failed: Error adding license to ${document.fileName}: ${addLicenseError.message}`
			);
			this.isProcessingAutoSave = false;
			return;
		}

		if (success === true) {
			// Success but don't show info message during auto-save
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

	public async enableAutoCorrect(): Promise<Result<void, Error>> {
		const [, updateError] = await tryCatch(
			this.configurationService.updateAutoCorrect(true)
		);

		if (updateError) {
			return [null, updateError];
		}

		return [undefined, null];
	}

	public async disableAutoCorrect(): Promise<Result<void, Error>> {
		const [, updateError] = await tryCatch(
			this.configurationService.updateAutoCorrect(false)
		);

		if (updateError) {
			return [null, updateError];
		}

		return [undefined, null];
	}

	public async addLicenseToFile(
		licenseType?: LicenseType
	): Promise<Result<boolean, Error>> {
		const licenseTypeToUse =
			licenseType || this.configurationService.defaultLicense.name;

		if (licenseTypeToUse === undefined) {
			error(`License manager: No license type found in configuration`);
			return [null, new Error(ERROR_MESSAGES.NO_LICENSE_TYPE)];
		}

		// Validate that the license type is available
		const [availableLicenses, availableLicensesError] =
			await this.availableLicenses();
		if (availableLicensesError) {
			return [null, availableLicensesError];
		}

		if (!availableLicenses.includes(licenseTypeToUse)) {
			return [
				null,
				new Error(
					`License type "${licenseTypeToUse}" is not available. Available types: ${availableLicenses.join(
						", "
					)}`
				),
			];
		}

		const [template, hasTemplateError] =
			await this.templateService.getTemplate(licenseTypeToUse);

		if (hasTemplateError) {
			return [null, hasTemplateError];
		}

		const [processedTemplate, hasProcessedTemplateError] =
			await this.templateService.processTemplate(template);

		if (hasProcessedTemplateError) {
			error(
				`License manager: Template processing failed: ${hasProcessedTemplateError.message}`
			);
			return [null, hasProcessedTemplateError];
		}

		if (
			!processedTemplate.content ||
			processedTemplate.content.trim() === ""
		) {
			const errMsg = "Processed template content is empty";
			error(`License manager: ${errMsg}`);
			return [null, new Error(errMsg)];
		}

		const licenseService = new LicenseService(
			this.fileService.language,
			processedTemplate.content
		);

		const formattedLicense =
			this.fileService.commentStyle.type === "line"
				? licenseService.formatLineLicense()
				: licenseService.formatBlockLicense();

		const [result, resultError] = await this.fileService.insertIntoFile(
			formattedLicense
		);

		if (resultError) {
			return [null, resultError];
		}

		return [result, null];
	}

	private async correctLicense(
		extractedLicense: ExtractedLicense
	): Promise<Result<boolean, Error>> {
		this.isAutoCorrecting = true;
		const licenseTypeToUse = this.configurationService.defaultLicense.name;

		if (licenseTypeToUse === undefined) {
			error(`License manager: No license type found in configuration`);
			this.isAutoCorrecting = false;
			return [null, new Error(ERROR_MESSAGES.NO_LICENSE_TYPE)];
		}

		const [template, hasTemplateError] =
			await this.templateService.getTemplate(licenseTypeToUse);

		if (hasTemplateError) {
			this.isAutoCorrecting = false;
			return [null, hasTemplateError];
		}

		const [processedTemplate, hasProcessedTemplateError] =
			await this.templateService.processTemplate(template);

		if (hasProcessedTemplateError) {
			this.isAutoCorrecting = false;
			return [null, hasProcessedTemplateError];
		}

		const licenseService = new LicenseService(
			this.fileService.language,
			processedTemplate.content
		);

		const formattedLicense =
			this.fileService.commentStyle.type === "line"
				? licenseService.formatLineLicense()
				: licenseService.formatBlockLicense();

		const [result, resultError] = await this.fileService.replaceLicense(
			extractedLicense,
			formattedLicense
		);

		if (resultError) {
			this.isAutoCorrecting = false;
			return [null, resultError];
		}

		this.isAutoCorrecting = false;
		return [result, null];
	}

	private async getFormattedDefaultLicense(): Promise<Result<string, Error>> {
		const licenseTypeToUse = this.configurationService.defaultLicense.name;

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

		const formattedLicense =
			this.fileService.commentStyle.type === "line"
				? licenseService.formatLineLicense()
				: licenseService.formatBlockLicense();

		return [formattedLicense, null];
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
