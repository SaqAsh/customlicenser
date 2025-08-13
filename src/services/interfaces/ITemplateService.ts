import { LicenseTemplate } from "../../types/LicenseTemplate";
import { LicenseType } from "../../types/LicenseType";

export interface ITemplateService {
	readonly currentTemplate: LicenseTemplate;
	readonly defaultLicenseTemplate: LicenseTemplate;
	get allCustomTemplates(): LicenseTemplate[];
	readonly allTemplates: LicenseTemplate[];

	createCustomTemplate(name: string, content: string): Promise<void>;
	updateCustomTemplate(name: string, content: string): Promise<void>;
	deleteCustomTemplate(name: string): Promise<void>;
	processTemplate(
		template: LicenseTemplate
	): Promise<Result<LicenseTemplate, Error>>;

	getTemplate(
		licenseType: LicenseType
	): Promise<Result<LicenseTemplate, Error>>;
}
