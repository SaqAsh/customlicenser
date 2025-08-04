import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";

import { LicenseTemplatePaths } from "../constants/LicenseTemplatePaths";
import { LicenseTemplate } from "../types/LicenseTemplate";
import { LicenseType } from "../types/LicenseType";
import error from "../utils/loggers/error";
import { IConfigService } from "./interfaces/IConfigService";
import { ITemplateService } from "./interfaces/ITemplateService";
export class TemplateService implements ITemplateService {
	readonly currentTemplate: LicenseTemplate;
	readonly defaultLicenseTemplate: LicenseTemplate;
	readonly allCustomTemplates: LicenseTemplate[];

	readonly configService: IConfigService;

	constructor(
		configService: IConfigService,
		currentTemplate: LicenseTemplate
	) {
		this.configService = configService;
		this.currentTemplate = currentTemplate;
		this.defaultLicenseTemplate = this.configService.getDefaultLicense;
		this.allCustomTemplates = this.configService.allCustomTemplates;
	}

	getTemplate(licenseType: LicenseType): Promise<string | undefined> {
		const filePath = LicenseTemplatePaths[licenseType];
		return this.readTemplateFromFile(filePath);
	}

	private async readTemplateFromFile(
		filePath: string
	): Promise<string | undefined> {
		const extensionPath =
			vscode.extensions.getExtension("customlicenser")?.extensionPath;
		if (extensionPath === undefined) {
			error(
				"Extension path is undefined. Ensure the extension is installed."
			);
			return "";
		}
		const templatePath = path.join(
			extensionPath || __dirname,
			"src",
			"license-templates",
			filePath
		);
		return await fs.readFile(templatePath, "utf-8");
	}

	public async createCustomTemplate(
		name: string,
		content: string
	): Promise<void> {
		const newTemplate: LicenseTemplate = {
			name,
			content,
		};

		const currentTemplates: LicenseTemplate[] =
			this.configService.allCustomTemplates;

		const existingTemplate = currentTemplates.find(
			(template) => template.name === name
		);
		if (existingTemplate) {
			error(`Template with name "${name}" already exists`);
			return;
		}

		const updatedTemplates = [...currentTemplates, newTemplate];
		await this.configService.updateCustomTemplates(updatedTemplates);
	}

	public async updateCustomTemplate(
		name: string,
		content: string
	): Promise<void> {
		const currentTemplates: LicenseTemplate[] =
			this.configService.allCustomTemplates;

		const templateIndex = currentTemplates.findIndex(
			(template) => template.name === name
		);
		if (templateIndex === -1) {
			error(`Template with name "${name}" not found`);
			return;
		}

		const updatedTemplates = [...currentTemplates];
		updatedTemplates[templateIndex] = {
			name,
			content,
		};

		await this.configService.updateCustomTemplates(updatedTemplates);
	}

	public async deleteCustomTemplate(name: string): Promise<void> {
		const currentTemplates: LicenseTemplate[] =
			this.configService.allCustomTemplates;

		const updatedTemplates = currentTemplates.filter(
			(template) => template.name !== name
		);

		if (updatedTemplates.length === currentTemplates.length) {
			error(`Template with name "${name}" not found`);
			return;
		}

		await this.configService.updateCustomTemplates(updatedTemplates);
	}
}
