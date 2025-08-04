import * as vscode from "vscode";
import { LicenseTemplate } from "../../types";

export interface ILicenseManager {
	start(): Promise<void>;
	stop(): Promise<void>;

	enableAutoSave(): Promise<void>;
	disableAutoSave(): Promise<void>;
	isAutoSaveEnabled(): boolean;

	addLicenseToFile(licenseType?: string): Promise<boolean>;

	getAvailableLicenses(): Promise<string[]>;
	getDefaultLicense(): LicenseTemplate;
}
