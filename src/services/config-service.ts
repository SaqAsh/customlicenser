import * as vscode from "vscode";
import { LicenseTemplate, LicenseType } from "../types";
import { IConfigService } from "./interfaces";
import { CONFIG_SECTION, CONFIG_KEYS, DEFAULT_VALUES } from "../constants";

export class ConfigService implements IConfigService {
	private get config(): vscode.WorkspaceConfiguration {
		return vscode.workspace.getConfiguration(CONFIG_SECTION);
	}

	public getCustomLicenserConfigValue<T>(key: string): T | undefined {
		return this.config.get<T>(key);
	}

	public get getAuthorName(): string {
		return (
			this.getCustomLicenserConfigValue<string>(
				CONFIG_KEYS.AUTHOR_NAME
			) ?? DEFAULT_VALUES.AUTHOR_NAME
		);
	}

	public get allTemplates(): LicenseTemplate[] {
		return (
			this.getCustomLicenserConfigValue<LicenseTemplate[]>(
				CONFIG_KEYS.TEMPLATES
			) ?? DEFAULT_VALUES.TEMPLATES
		);
	}

	public getYear(): string {
		return (
			this.getCustomLicenserConfigValue<string>(CONFIG_KEYS.YEAR) ??
			DEFAULT_VALUES.YEAR
		);
	}

	public get getDefaultLicense(): LicenseTemplate {
		return (
			this.getCustomLicenserConfigValue<LicenseTemplate>(
				CONFIG_KEYS.DEFAULT_LICENSE
			) ?? DEFAULT_VALUES.DEFAULT_LICENSE
		);
	}

	public get isAutoAddEnabled(): boolean {
		return (
			this.getCustomLicenserConfigValue<boolean>(
				CONFIG_KEYS.TOGGLE_ON_SAVE
			) ?? DEFAULT_VALUES.TOGGLE_ON_SAVE
		);
	}

	public get allCustomTemplates(): LicenseTemplate[] {
		return (
			this.config.get<LicenseTemplate[]>(CONFIG_KEYS.CUSTOM_TEMPLATES) ??
			DEFAULT_VALUES.CUSTOM_TEMPLATES
		);
	}

	public async updateAuthorName(value: string): Promise<void> {
		await this.updateConfig(CONFIG_KEYS.AUTHOR_NAME, value);
	}

	public async updateYear(value: string): Promise<void> {
		await this.updateConfig(CONFIG_KEYS.YEAR, value);
	}

	public async updateDefaultLicense(
		licenseTemplate: LicenseTemplate
	): Promise<void> {
		await this.updateConfig<LicenseTemplate>(
			CONFIG_KEYS.DEFAULT_LICENSE,
			licenseTemplate
		);
	}

	public async updateAutoAddEnabled(value: boolean): Promise<void> {
		await this.updateConfig(CONFIG_KEYS.TOGGLE_ON_SAVE, value);
	}

	public async updateCustomTemplates(
		templates: LicenseTemplate[]
	): Promise<void> {
		await this.updateConfig(CONFIG_KEYS.CUSTOM_TEMPLATES, templates);
	}

	private async updateConfig<T>(key: string, value: T): Promise<void> {
		await this.config.update(key, value, true);
	}
}
