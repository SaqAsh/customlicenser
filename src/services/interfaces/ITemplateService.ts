import { LicenseTemplate } from "../../types/LicenseTemplate";
import { LicenseType } from "../../types/LicenseType";

export interface ITemplateService {
    readonly currentTemplate: LicenseTemplate;
    readonly defaultLicenseTemplate: LicenseTemplate;
    readonly allCustomTemplates: LicenseTemplate[];

    createCustomTemplate(name: string, content: string): Promise<void>;
    updateCustomTemplate(name: string, content: string): Promise<void>;
    deleteCustomTemplate(name: string): Promise<void>;

    getTemplate(licenseType: LicenseType): Promise<string | undefined>;
}
