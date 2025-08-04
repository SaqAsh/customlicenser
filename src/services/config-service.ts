import * as vscode from "vscode";
import { IConfigService } from "./interfaces/IConfigService";

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

	public getYear(): string {
		return (
			this.getCustomLicenserConfigValue<string>("year") ??
			new Date().getFullYear().toString()
		);
	}

	public get getDefaultLicense(): string {
		return (
			this.getCustomLicenserConfigValue<string>("defaultLicense") ?? ""
		);
	}

	public get isAutoAddEnabled(): boolean {
		return (
			this.getCustomLicenserConfigValue<boolean>("toggleOnSave") ?? false
		);
	}

	public async updateAuthorName(value: string): Promise<void> {
		await this.updateConfig("authorName", value);
	}

	public async updateYear(value: string): Promise<void> {
		await this.updateConfig("year", value);
	}

	public async updateDefaultLicense(value: string): Promise<void> {
		await this.updateConfig("defaultLicense", value);
	}

	public async updateAutoAddEnabled(value: boolean): Promise<void> {
		await this.updateConfig("toggleOnSave", value);
	}

	private async updateConfig<T>(key: string, value: T): Promise<void> {
		await this.config.update(key, value, true);
	}
}
