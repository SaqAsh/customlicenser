import * as vscode from "vscode";
import { LicenseTemplate, LicenseType } from "../types";
import { IConfigService } from "./interfaces";

export class ConfigService implements IConfigService {
	private readonly configName = "customlicenser";

	private get config(): vscode.WorkspaceConfiguration {
		return vscode.workspace.getConfiguration(this.configName);
	}

	public getCustomLicenserConfigValue<T>(key: string): T | undefined {
		return this.config.get<T>(key);
	}

	public get getAuthorName(): string {
		return this.getCustomLicenserConfigValue<string>("authorName") ?? "";
	}

	public get allTemplates(): LicenseTemplate[] {
		return (
			this.getCustomLicenserConfigValue<LicenseTemplate[]>("templates") ??
			[]
		);
	}

	public getYear(): string {
		return (
			this.getCustomLicenserConfigValue<string>("year") ??
			new Date().getFullYear().toString()
		);
	}

	public get getDefaultLicense(): LicenseTemplate {
		return (
			this.getCustomLicenserConfigValue<LicenseTemplate>(
				"defaultLicense"
			) ?? { name: "" as LicenseType, content: "" }
		);
	}

	public get isAutoAddEnabled(): boolean {
		return (
			this.getCustomLicenserConfigValue<boolean>("toggleOnSave") ?? false
		);
	}

	public get allCustomTemplates(): LicenseTemplate[] {
		return this.config.get<LicenseTemplate[]>("customTemplates") ?? [];
	}

	public async updateAuthorName(value: string): Promise<void> {
		await this.updateConfig("authorName", value);
	}

	public async updateYear(value: string): Promise<void> {
		await this.updateConfig("year", value);
	}

	public async updateDefaultLicense(
		licenseTemplate: LicenseTemplate
	): Promise<void> {
		await this.updateConfig<LicenseTemplate>(
			"defaultLicense",
			licenseTemplate
		);
	}

	public async updateAutoAddEnabled(value: boolean): Promise<void> {
		await this.updateConfig("toggleOnSave", value);
	}

	public async updateCustomTemplates(
		templates: LicenseTemplate[]
	): Promise<void> {
		await this.updateConfig("customTemplates", templates);
	}

	private async updateConfig<T>(key: string, value: T): Promise<void> {
		await this.config.update(key, value, true);
	}
}
