import * as vscode from "vscode";

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
	private autoSaveDisposable: vscode.Disposable | undefined;
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

	enableAutoSave(): Promise<void> {
		try {
			if (this.autoSaveDisposable) {
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
						!this.isAutoSaveEnabled() ||
						!this.fileService.shouldProcessFile()
					) {
						return;
					}

					this.autoSaveDebounceTimer = setTimeout(async () => {
						try {
							this.isProcessingAutoSave = true;

							const [hasLicense, hasLicenseError] =
								await this.fileService.hasLicense();
							if (hasLicenseError) {
								return;
							}
							if (hasLicense) {
								return;
							}

							const success = await this.addLicenseToFile();
							if (success) {
								info(
									`${UI_MESSAGES.AUTO_ADDED_LICENSE} ${document.fileName}`
								);
							}
						} catch (err) {
							error(
								`${ERROR_MESSAGES.AUTO_SAVE_FAILED} ${
									document.fileName
								}: ${
									err instanceof Error
										? err.message
										: "Unknown error occurred"
								}`,
								err instanceof Error ? err : undefined
							);
						} finally {
							this.isProcessingAutoSave = false;
						}
					}, 100);
				}
			);

			return this.configurationService.updateAutoAddEnabled(true);
		} catch (err) {
			console.error("LicenseManager: Failed to enable auto-save:", err);
			return Promise.reject(err);
		}
	}

	disableAutoSave(): Promise<void> {
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

	async addLicenseToFile(licenseType?: LicenseType): Promise<boolean> {
		const licenseTypeToUse =
			licenseType || this.configurationService.defaultLicense.name;

		if (!licenseTypeToUse) {
			error(ERROR_MESSAGES.NO_LICENSE_TYPE);
			return false;
		}

		const template = await this.templateService.getTemplate(
			licenseTypeToUse
		);

		if (template === undefined) {
			error(`${ERROR_MESSAGES.TEMPLATE_NOT_FOUND} ${licenseTypeToUse}`);
			return false;
		}
		const processedTemplate = await this.templateService.processTemplate(
			template
		);

		if (processedTemplate.content === "") {
			error(`${ERROR_MESSAGES.TEMPLATE_NOT_FOUND} ${licenseTypeToUse}`);
			return false;
		}

		const language = this.fileService.language;
		const commentStyle = this.fileService.commentStyle;
		const licenseService = new LicenseService(
			language,
			processedTemplate.content
		);
		const formattedLicense =
			commentStyle.type === "line"
				? licenseService.formatLineLicense()
				: licenseService.formatBlockLicense();

		const [result, hasError] = await this.fileService.insertIntoFile(
			formattedLicense
		);

		if (hasError) {
			error(`${ERROR_MESSAGES.ERROR_IN_ADD_LICENSE} ${hasError}`);
			return false;
		}

		return result;
	}

	async getAvailableLicenses(): Promise<string[]> {
		const customTemplates = this.templateService.allCustomTemplates;
		const customLicenseNames = customTemplates.map(
			(template) => template.name
		);

		return [...STANDARD_LICENSES, ...customLicenseNames];
	}

	getDefaultLicense(): LicenseTemplate {
		return this.configurationService.defaultLicense;
	}

	isAutoSaveEnabled(): boolean {
		return this.configurationService.isAutoAddEnabled;
	}

	isAutoCorrectEnabled(): boolean {
		return this.configurationService.isAutoCorrectEnabled;
	}
}
