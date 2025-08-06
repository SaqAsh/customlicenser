import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";

import {
	ERROR_MESSAGES,
	EXTENSION_ID,
	LicenseTemplatePaths,
	TEMPLATE_DIRECTORY,
} from "../constants";
import { error } from "../loggers";
import { LicenseTemplate, LicenseType } from "../types";
import { IConfigService, ITemplateService } from "./interfaces";

export class TemplateService implements ITemplateService {
	readonly currentTemplate: LicenseTemplate;
	readonly defaultLicenseTemplate: LicenseTemplate;
	readonly allTemplates: LicenseTemplate[];

	readonly configService: IConfigService;

	constructor(
		configService: IConfigService,
		currentTemplate: LicenseTemplate
	) {
		this.configService = configService;
		this.currentTemplate = currentTemplate;
		this.defaultLicenseTemplate = this.configService.getDefaultLicense;
		this.allTemplates = this.configService.allTemplates;
	}

	async processTemplate(template: LicenseTemplate): Promise<LicenseTemplate> {
		if (template.content === undefined) {
			error(`${ERROR_MESSAGES.TEMPLATE_NOT_FOUND} ${template.name}`);
			return template;
		}

		const year = this.configService.getYear();
		const authorName = this.configService.getAuthorName;

		const processedContent = template.content
			.replace(/\{\{year\}\}/gi, year) // Added 'i' flag for case-insensitive
			.replace(/\{\{name\}\}/gi, authorName);

		return {
			...template,
			content: processedContent,
		};
	}

	get allCustomTemplates(): LicenseTemplate[] {
		return this.configService.allCustomTemplates;
	}

	async getTemplate(
		licenseType: LicenseType
	): Promise<LicenseTemplate | undefined> {
		const customTemplate = this.allCustomTemplates.find(
			(template) => template.name === licenseType
		);

		if (customTemplate) {
			return customTemplate;
		}

		const filePath = LicenseTemplatePaths[licenseType];
		if (filePath === undefined) {
			error(`${ERROR_MESSAGES.NO_TEMPLATE_PATH} ${licenseType}`);
			return undefined;
		}

		const content = await this.readTemplateFromFile(filePath);

		return {
			name: licenseType,
			content: content ?? "",
		};
	}

	private async findTemplateDirectory(): Promise<string | undefined> {
		const possiblePaths = [
			...(vscode.extensions.getExtension(EXTENSION_ID)?.extensionPath
				? [
						path.join(
							vscode.extensions.getExtension(EXTENSION_ID)!
								.extensionPath,
							TEMPLATE_DIRECTORY
						),
				  ]
				: []),
			path.join(process.cwd(), "dist", TEMPLATE_DIRECTORY),
			path.join(process.cwd(), "src", TEMPLATE_DIRECTORY),
			path.join(__dirname, "..", TEMPLATE_DIRECTORY),
			path.join(__dirname, "..", "dist", TEMPLATE_DIRECTORY),
			path.join(__dirname, "..", "..", TEMPLATE_DIRECTORY),
			path.join(__dirname, "..", "..", "dist", TEMPLATE_DIRECTORY),
		];

		for (const possiblePath of possiblePaths) {
			try {
				await fs.access(possiblePath);
				return possiblePath;
			} catch {
				continue;
			}
		}

		return undefined;
	}

	private async readTemplateFromFile(
		filePath: string
	): Promise<string | undefined> {
		try {
			const templateDir = await this.findTemplateDirectory();

			if (!templateDir) {
				error(ERROR_MESSAGES.TEMPLATE_DIRECTORY_NOT_FOUND);
				return undefined;
			}

			const fullPath = path.join(templateDir, filePath);

			try {
				await fs.access(fullPath);
			} catch {
				error(`${ERROR_MESSAGES.TEMPLATE_FILE_NOT_FOUND} ${fullPath}`);
				return undefined;
			}

			const content = await fs.readFile(fullPath, "utf-8");
			return content;
		} catch (err) {
			error(
				`${ERROR_MESSAGES.FAILED_TO_READ_TEMPLATE} ${
					err instanceof Error
						? err.message
						: "Unknown error occurred"
				}`,
				err instanceof Error ? err : undefined
			);
			return undefined;
		}
	}

	public async createCustomTemplate(
		name: LicenseType,
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
		name: LicenseType,
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
