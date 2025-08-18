import { LicenseTemplate, LicenseType } from "../../types";

export interface ILicenseManager {
	start(): Promise<void>;
	stop(): Promise<void>;

	enableAutoSave(): Promise<Result<void, Error>>;
	disableAutoSave(): Promise<void>;
	get isAutoSaveEnabled(): boolean;

	enableAutoCorrect(): Promise<Result<void, Error>>;
	disableAutoCorrect(): Promise<Result<void, Error>>;
	get isAutoCorrectEnabled(): boolean;

	addLicenseToFile(
		licenseType?: LicenseType
	): Promise<Result<boolean, Error>>;

	availableLicenses(): Promise<Result<string[], Error>>;
	get defaultLicense(): LicenseTemplate;
}
