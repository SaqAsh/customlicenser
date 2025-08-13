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
import { LicenseTemplate, LicenseType } from "../types";
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

	async processTemplate(template: LicenseTemplate): Promise<LicenseTemplate> {
		if (template.content === undefined) {
			error(`${ERROR_MESSAGES.TEMPLATE_NOT_FOUND} ${template.name}`);
			return template;
		}

		const year = this.configService.year;
		const authorName = this.configService.authorName;

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

		const templateContent = this.licenseTemplates[licenseType];
		if (templateContent === undefined) {
			error(`${ERROR_MESSAGES.TEMPLATE_NOT_FOUND} ${licenseType}`);
			return undefined;
		}

		return {
			name: licenseType,
			content: templateContent,
		};
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
