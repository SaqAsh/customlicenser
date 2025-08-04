export interface IConfigService {
    getAuthorName: string;
    getYear(): string;
    getDefaultLicense: string;
    isAutoAddEnabled: boolean;

    updateAuthorName(value: string): Promise<void>;
    updateYear(value: string): Promise<void>;
    updateDefaultLicense(value: string): Promise<void>;
    updateAutoAddEnabled(value: boolean): Promise<void>;
}
