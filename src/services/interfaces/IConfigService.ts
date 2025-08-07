import { LicenseTemplate } from "../../types/LicenseTemplate";

export interface IConfigService {
    authorName: string;
    year: string;
    defaultLicense: LicenseTemplate;
    isAutoAddEnabled: boolean;
    isAutoCorrectEnabled: boolean;
    allCustomTemplates: LicenseTemplate[];
    allTemplates: LicenseTemplate[];

    updateAuthorName(value: string): Promise<void>;
    updateYear(value: string): Promise<void>;
    updateDefaultLicense(value: LicenseTemplate): Promise<void>;
    updateAutoAddEnabled(value: boolean): Promise<void>;
    updateCustomTemplates(templates: LicenseTemplate[]): Promise<void>;
}
