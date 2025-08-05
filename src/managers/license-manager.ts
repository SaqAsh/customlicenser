import * as vscode from "vscode";

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

                            const hasLicense =
                                await this.fileService.hasLicense();
                            if (hasLicense) {
                                return;
                            }

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

            if (licenseTypeToUse) {
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

            if (template === undefined) {
                error(
                    `Template not found for license type: ${licenseTypeToUse}`
                );
                return false;
            }

            const language = this.fileService.language;
            const commentStyle = this.fileService.commentStyle;
            const licenseService = new LicenseService(language, template);
            const formattedLicense =
                commentStyle.type === "line"
                    ? licenseService.formatLineLicense()
                    : licenseService.formatBlockLicense();

            const result = await this.fileService.insertIntoFile(
                formattedLicense
            );

            return result;
        } catch (err) {
            if (err instanceof Error) {
                console.error(
                    "LicenseManager: Error in addLicenseToFile:",
                    err.message
                );
                return false;
            }
            error("LicenseManager: Error in addLicenseToFile");
            return false;
        }
    }

    async getAvailableLicenses(): Promise<string[]> {
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
