import {
	APACHE_TEMPLATE,
	BSD_TEMPLATE,
	ERROR_MESSAGES,
	GPL_TEMPLATE,
	ISC_TEMPLATE,
	MIT_TEMPLATE,
	MOZILLA_TEMPLATE,
} from "../constants";
import { error } from "../loggers";
import { LicenseTemplate, LicenseType, Result } from "../types";
import { IConfigService, ITemplateService } from "./interfaces";

export class TemplateService implements ITemplateService {
	readonly currentTemplate: LicenseTemplate;
	readonly defaultLicenseTemplate: LicenseTemplate;
	readonly allTemplates: LicenseTemplate[];

	readonly configService: IConfigService;

	private readonly licenseTemplates: Record<string, string> = {
		mit: MIT_TEMPLATE,
		apache: APACHE_TEMPLATE,
		bsd: BSD_TEMPLATE,
		gpl: GPL_TEMPLATE,
		isc: ISC_TEMPLATE,
		mozilla: MOZILLA_TEMPLATE,
	};

	constructor(
		configService: IConfigService,
		currentTemplate: LicenseTemplate
	) {
		this.configService = configService;
		this.currentTemplate = currentTemplate;
		this.defaultLicenseTemplate = this.configService.defaultLicense;
		this.allTemplates = this.configService.allTemplates;
	}

	async processTemplate(
		template: LicenseTemplate
	): Promise<Result<LicenseTemplate, Error>> {
		if (template.content === undefined || template.content === "") {
			const errMsg = `${ERROR_MESSAGES.TEMPLATE_NOT_FOUND}: ${template.name}`;
			return [null, new Error(errMsg)];
		}

		try {
			const year = this.configService.year;
			const authorName = this.configService.authorName || "Your Name";

			// Check if we have valid replacement values
			if (!year) {
				const errMsg = `Missing year configuration: year=${year}`;
				return [null, new Error(errMsg)];
			}

			const processedContent = template.content
				.replace(/\{\{year\}\}/gi, year)
				.replace(/\{\{name\}\}/gi, authorName);

			const processedTemplate = {
				...template,
				content: processedContent,
			};

			return [processedTemplate, null];
		} catch (error) {
			return [
				null,
				error instanceof Error ? error : new Error(String(error)),
			];
		}
	}

	get allCustomTemplates(): LicenseTemplate[] {
		return this.configService.allCustomTemplates;
	}

	async getTemplate(
		licenseType: LicenseType
	): Promise<Result<LicenseTemplate, Error>> {
		// First check standard templates
		const templateContent = this.licenseTemplates[licenseType];
		if (templateContent !== undefined) {
			return [
				{
					name: licenseType,
					content: templateContent,
				},
				null,
			];
		}

		// Then check custom templates
		const customTemplate = this.configService.allCustomTemplates.find(
			(template) => template.name === licenseType
		);
		if (customTemplate) {
			return [customTemplate, null];
		}

		// Template not found in either standard or custom templates
		const errMsg = `${ERROR_MESSAGES.TEMPLATE_NOT_FOUND} ${licenseType}`;
		error(`Template service: ${errMsg}`);
		return [null, new Error(errMsg)];
	}

	public async createCustomTemplate(
		name: string,
		content: string
	): Promise<void> {
		const newTemplate: LicenseTemplate = {
			name: name as LicenseType,
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
			const errMsg = `Template with name "${name}" not found`;
			error(errMsg);
			return;
		}

		const updatedTemplates = [...currentTemplates];
		updatedTemplates[templateIndex] = {
			name: name as LicenseType,
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
