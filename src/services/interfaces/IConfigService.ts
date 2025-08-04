import { LicenseTemplate } from "../../types/LicenseTemplate";

export interface IConfigService {
    getAuthorName: string;
    getYear(): string;
    getDefaultLicense: LicenseTemplate;
    isAutoAddEnabled: boolean;
    allCustomTemplates: LicenseTemplate[];

    updateAuthorName(value: string): Promise<void>;
    updateYear(value: string): Promise<void>;
    updateDefaultLicense(value: LicenseTemplate): Promise<void>;
    updateAutoAddEnabled(value: boolean): Promise<void>;
    updateCustomTemplates(templates: LicenseTemplate[]): Promise<void>;
}
