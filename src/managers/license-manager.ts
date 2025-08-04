import {
	IConfigService,
	IFileService,
	ITemplateService,
} from "../services/interfaces";
import { LicenseService } from "../services/license-service";
import { LicenseTemplate, LicenseType } from "../types";
import { ILicenseManager } from "./interfaces/ILicenseManager";

export class LicenseManager implements ILicenseManager {
	private readonly configurationService: IConfigService;
	private readonly templateService: ITemplateService;
	private readonly fileService: IFileService;

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
		throw new Error("Method not implemented.");
	}

	stop(): Promise<void> {
		throw new Error("Method not implemented.");
	}

	enableAutoSave(): Promise<void> {
		return this.configurationService.updateAutoAddEnabled(true);
	}

	disableAutoSave(): Promise<void> {
		return this.configurationService.updateAutoAddEnabled(false);
	}

	isAutoSaveEnabled(): boolean {
		return this.configurationService.isAutoAddEnabled;
	}

	async addLicenseToFile(licenseType?: LicenseType): Promise<boolean> {
		const licenseTypeToUse =
			licenseType || this.configurationService.getDefaultLicense.name;

		if (!licenseTypeToUse) {
			throw new Error(
				"No license type provided and no default license configured"
			);
		}

		const template = await this.templateService.getTemplate(
			licenseTypeToUse
		);

		if (!template) {
			throw new Error(
				`Template not found for license type: ${licenseTypeToUse}`
			);
		}

		const language = this.fileService.language;
		const commentStyle = this.fileService.commentStyle;

		const licenseService = new LicenseService(language, template);

		const formattedLicense =
			commentStyle.type === "line"
				? licenseService.formatLineLicense()
				: licenseService.formatBlockLicense();

		return this.fileService.insertIntoFile(formattedLicense);
	}

	async getAvailableLicenses(): Promise<string[]> {
		const allTemplates = this.templateService.allTemplates;
		const customTemplates = this.templateService.allCustomTemplates;

		const allLicenseNames = allTemplates.map((template) => template.name);
		const customLicenseNames = customTemplates.map(
			(template) => template.name
		);

		return [...allLicenseNames, ...customLicenseNames];
	}

	getDefaultLicense(): LicenseTemplate {
		return this.configurationService.getDefaultLicense;
	}
}
