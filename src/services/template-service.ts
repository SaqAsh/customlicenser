import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";

import { LicenseTemplatePaths } from "../constants";
import { LicenseTemplate, LicenseType } from "../types";
import { error } from "../loggers";
import { IConfigService, ITemplateService } from "./interfaces";

export class TemplateService implements ITemplateService {
	readonly currentTemplate: LicenseTemplate;
	readonly defaultLicenseTemplate: LicenseTemplate;
	readonly allCustomTemplates: LicenseTemplate[];
	readonly allTemplates: LicenseTemplate[];

	readonly configService: IConfigService;

	// Cache for template content to avoid repeated file reads
	private templateCache: Map<string, string> = new Map();
	private templatePathCache: string | undefined;

	constructor(
		configService: IConfigService,
		currentTemplate: LicenseTemplate
	) {
		this.configService = configService;
		this.currentTemplate = currentTemplate;
		this.defaultLicenseTemplate = this.configService.getDefaultLicense;
		this.allCustomTemplates = this.configService.allCustomTemplates;
		this.allTemplates = this.configService.allTemplates;
	}

	async getTemplate(licenseType: LicenseType): Promise<string | undefined> {
		// Check cache first
		if (this.templateCache.has(licenseType)) {
			return this.templateCache.get(licenseType);
		}

		// Check if it's a custom template first
		const customTemplate = this.allCustomTemplates.find(
			(template) => template.name === licenseType
		);

		if (customTemplate) {
			// Cache the custom template
			this.templateCache.set(licenseType, customTemplate.content);
			return customTemplate.content;
		}

		// If not a custom template, try to read from file
		const filePath = LicenseTemplatePaths[licenseType];
		if (!filePath) {
			error(`No template path found for license type: ${licenseType}`);
			return undefined;
		}

		const content = await this.readTemplateFromFile(filePath);

		// Cache the result
		if (content) {
			this.templateCache.set(licenseType, content);
		}

		return content;
	}

	private async findTemplateDirectory(): Promise<string | undefined> {
		// Use cached path if available
		if (this.templatePathCache) {
			return this.templatePathCache;
		}

		const possiblePaths = [
			// Try extension path first (for production)
			...(vscode.extensions.getExtension("customlicenser")?.extensionPath
				? [
						path.join(
							vscode.extensions.getExtension("customlicenser")!
								.extensionPath,
							"license-templates"
						),
				  ]
				: []),
			// Try relative to current working directory (for debug mode)
			path.join(process.cwd(), "dist", "license-templates"),
			path.join(process.cwd(), "src", "license-templates"),
			// Try relative to __dirname (compiled JS location)
			path.join(__dirname, "..", "license-templates"),
			path.join(__dirname, "..", "dist", "license-templates"),
			// Try relative to extension root
			path.join(__dirname, "..", "..", "license-templates"),
			path.join(__dirname, "..", "..", "dist", "license-templates"),
		];

		// Find the first path that exists
		for (const possiblePath of possiblePaths) {
			try {
				await fs.access(possiblePath);
				this.templatePathCache = possiblePath;
				return possiblePath;
			} catch {
				// Continue to next path
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
				error("Template directory not found");
				return undefined;
			}

			const fullPath = path.join(templateDir, filePath);

			try {
				await fs.access(fullPath);
			} catch {
				error(`Template file not found: ${fullPath}`);
				return undefined;
			}

			return await fs.readFile(fullPath, "utf-8");
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Unknown error occurred";
			error(
				`Failed to read template file: ${errorMessage}`,
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

		// Clear template cache when templates are modified
		this.templateCache.clear();
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

		// Clear template cache when templates are modified
		this.templateCache.clear();
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
