import { LicenseTemplate, LicenseType } from "../../types";

export interface ILicenseManager {
	start(): Promise<void>;
	stop(): Promise<void>;

	enableAutoSave(): Promise<void>;
	disableAutoSave(): Promise<void>;
	isAutoSaveEnabled(): boolean;

	addLicenseToFile(licenseType?: LicenseType): Promise<boolean>;

	getAvailableLicenses(): Promise<string[]>;
	getDefaultLicense(): LicenseTemplate;
}
