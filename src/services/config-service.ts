import * as vscode from "vscode";
import { CONFIG_KEYS, CONFIG_SECTION, DEFAULT_VALUES } from "../constants";
import { error } from "../loggers";
import { LicenseTemplate } from "../types";
import { IConfigService } from "./interfaces";

export class ConfigService implements IConfigService {
	private get config(): vscode.WorkspaceConfiguration {
		return vscode.workspace.getConfiguration(CONFIG_SECTION);
	}

	public getCustomLicenserConfigValue<T>(key: string): T | undefined {
		const value = this.config.get<T>(key);
		return value;
	}

	public get authorName(): string {
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

	public get year(): string {
		return (
			this.getCustomLicenserConfigValue<string>(CONFIG_KEYS.YEAR) ??
			DEFAULT_VALUES.YEAR
		);
	}

	public get defaultLicense(): LicenseTemplate {
		const defaultLicense =
			this.getCustomLicenserConfigValue<LicenseTemplate>(
				CONFIG_KEYS.DEFAULT_LICENSE
			) ?? DEFAULT_VALUES.DEFAULT_LICENSE;
		return defaultLicense;
	}

	public get isAutoAddEnabled(): boolean {
		return (
			this.getCustomLicenserConfigValue<boolean>(
				CONFIG_KEYS.TOGGLE_ON_SAVE
			) ?? DEFAULT_VALUES.TOGGLE_ON_SAVE
		);
	}

	public get isAutoCorrectEnabled(): boolean {
		return (
			this.getCustomLicenserConfigValue<boolean>(
				CONFIG_KEYS.AUTO_CORRECT
			) ?? false
		);
	}

	public get allCustomTemplates(): LicenseTemplate[] {
		const customTemplates =
			this.config.get<LicenseTemplate[]>(CONFIG_KEYS.CUSTOM_TEMPLATES) ??
			DEFAULT_VALUES.CUSTOM_TEMPLATES;
		return customTemplates;
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

	public async updateAutoCorrect(value: boolean): Promise<void> {
		await this.updateConfig(CONFIG_KEYS.AUTO_CORRECT, value);
	}

	private async updateConfig<T>(key: string, value: T): Promise<void> {
		try {
			await this.config.update(key, value, true);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Unknown error";
			error(
				`Config service: Failed to update config key "${key}": ${errorMessage}`
			);
			throw err;
		}
	}
}
