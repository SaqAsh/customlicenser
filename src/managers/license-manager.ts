import * as vscode from "vscode";
import {
	IConfigService,
	IFileService,
	ITemplateService,
} from "../services/interfaces";
import { LicenseService } from "../services/license-service";
import { LicenseTemplate, LicenseType } from "../types";
import { ILicenseManager } from "./interfaces/ILicenseManager";
import { error, info } from "../loggers";

export class LicenseManager implements ILicenseManager {
	private readonly configurationService: IConfigService;
	private readonly templateService: ITemplateService;
	private readonly fileService: IFileService;
	private autoSaveDisposable: vscode.Disposable | undefined;
	private autoSaveDebounceTimer: NodeJS.Timeout | undefined;
	private isProcessingAutoSave: boolean = false; // Flag to prevent infinite loops

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
		// Clean up auto-save listener and timer
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
			// Dispose existing listener if any
			if (this.autoSaveDisposable) {
				this.autoSaveDisposable.dispose();
			}

			// Set up file save listener with minimal debouncing
			this.autoSaveDisposable = vscode.workspace.onDidSaveTextDocument(
				async (document) => {
					// Prevent infinite loops - don't process if already processing
					if (this.isProcessingAutoSave) {
						return;
					}

					// Clear existing timer
					if (this.autoSaveDebounceTimer) {
						clearTimeout(this.autoSaveDebounceTimer);
					}

					// Quick check before debouncing
					if (
						!this.isAutoSaveEnabled() ||
						!this.fileService.shouldProcessFile()
					) {
						return;
					}

					// Minimal debounce for performance
					this.autoSaveDebounceTimer = setTimeout(async () => {
						try {
							// Set processing flag to prevent infinite loops
							this.isProcessingAutoSave = true;

							// Check if file already has a license (cached result)
							const hasLicense =
								await this.fileService.hasLicense();
							if (hasLicense) {
								return;
							}

							// Add license to file
							const success = await this.addLicenseToFile();
							if (success) {
								await info(
									`Auto-added license to ${document.fileName}`
								);
							}
						} catch (err) {
							const errorMessage =
								err instanceof Error
									? err.message
									: "Unknown error occurred";
							await error(
								`Auto-save failed for ${document.fileName}: ${errorMessage}`,
								err instanceof Error ? err : undefined
							);
						} finally {
							// Always reset the processing flag
							this.isProcessingAutoSave = false;
						}
					}, 100); // Reduced to 100ms for faster response
				}
			);

			return this.configurationService.updateAutoAddEnabled(true);
		} catch (err) {
			console.error("LicenseManager: Failed to enable auto-save:", err);
			return Promise.reject(err);
		}
	}

	disableAutoSave(): Promise<void> {
		// Dispose the listener and timer
		if (this.autoSaveDisposable) {
			this.autoSaveDisposable.dispose();
			this.autoSaveDisposable = undefined;
		}
		if (this.autoSaveDebounceTimer) {
			clearTimeout(this.autoSaveDebounceTimer);
			this.autoSaveDebounceTimer = undefined;
		}

		// Reset processing flag
		this.isProcessingAutoSave = false;

		return this.configurationService.updateAutoAddEnabled(false);
	}

	isAutoSaveEnabled(): boolean {
		return this.configurationService.isAutoAddEnabled;
	}

	async addLicenseToFile(licenseType?: LicenseType): Promise<boolean> {
		try {
			console.log(
				`LicenseManager: Adding license to file, type: ${licenseType}`
			);

			const licenseTypeToUse =
				licenseType || this.configurationService.getDefaultLicense.name;

			if (!licenseTypeToUse) {
				throw new Error(
					"No license type provided and no default license configured"
				);
			}

			console.log(
				`LicenseManager: Using license type: ${licenseTypeToUse}`
			);

			const template = await this.templateService.getTemplate(
				licenseTypeToUse
			);

			if (!template) {
				throw new Error(
					`Template not found for license type: ${licenseTypeToUse}`
				);
			}

			console.log(
				`LicenseManager: Template found, length: ${template.length}`
			);

			const language = this.fileService.language;
			const commentStyle = this.fileService.commentStyle;

			console.log(
				`LicenseManager: Language: ${language}, Comment style: ${commentStyle.type}`
			);

			const licenseService = new LicenseService(language, template);

			const formattedLicense =
				commentStyle.type === "line"
					? licenseService.formatLineLicense()
					: licenseService.formatBlockLicense();

			console.log(
				`LicenseManager: Formatted license length: ${formattedLicense.length}`
			);

			const result = await this.fileService.insertIntoFile(
				formattedLicense
			);
			console.log(`LicenseManager: Insert result: ${result}`);

			return result;
		} catch (err) {
			console.error("LicenseManager: Error in addLicenseToFile:", err);
			throw err;
		}
	}

	async getAvailableLicenses(): Promise<string[]> {
		// Standard license types
		const standardLicenses: LicenseType[] = [
			"mit",
			"apache",
			"gpl",
			"bsd",
			"isc",
			"mozilla",
		];

		// Custom templates
		const customTemplates = this.templateService.allCustomTemplates;
		const customLicenseNames = customTemplates.map(
			(template) => template.name
		);

		return [...standardLicenses, ...customLicenseNames];
	}

	getDefaultLicense(): LicenseTemplate {
		return this.configurationService.getDefaultLicense;
	}
}
