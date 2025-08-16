export interface ILicenseService {
    formatBlockLicense(): string;
    formatLineLicense(): string;
    extractLicenseFromContent(content: string): string;
}
