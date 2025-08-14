import { LicenseTemplate } from "../../types/LicenseTemplate";
import { LicenseType } from "../../types/LicenseType";
import { Result } from "../../types/Result";

export interface ITemplateService {
    readonly currentTemplate: LicenseTemplate;
    readonly defaultLicenseTemplate: LicenseTemplate;
    get allCustomTemplates(): LicenseTemplate[];

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
