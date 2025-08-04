import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";
import { LicenseTemplatePaths } from "../constants/LicenseTemplatePaths";
import { LicenseType } from "../types/LicenseType";
import error from "../utils/loggers/error";
import { ITemplateService } from "./interfaces/ITemplateService";
import { IConfigService } from "./interfaces/IConfigService";
import { LicenseTemplate } from "../types/LicenseTemplate";
export class TemplateService implements ITemplateService {
    readonly currentTemplate: LicenseTemplate;
    readonly defaultLicenseTemplate: LicenseTemplate;
    readonly allCustomTemplates: LicenseTemplate[];

    readonly configService: IConfigService;

    constructor(configService: IConfigService, currentTemplate: LicenseTemplate) {
        this.configService = configService;
        this.currentTemplate = currentTemplate;
        this.defaultLicenseTemplate = this.configService.getDefaultLicense;
        this.allCustomTemplates = this.configService.allCustomTemplates;
    }

    getTemplate(licenseType: LicenseType): Promise<string | undefined> {
        const filePath = LicenseTemplatePaths[licenseType];
        return this.readTemplateFromFile(filePath);
    }

    private async readTemplateFromFile(
        filePath: string
    ): Promise<string | undefined> {
        try {
            const extensionPath =
                vscode.extensions.getExtension("customlicenser")?.extensionPath;
            if (extensionPath === undefined) {
                error(
                    "Extension path is undefined. Ensure the extension is installed."
                );
                return "";
            }
            const templatePath = path.join(
                extensionPath || __dirname,
                "src",
                "license-templates",
                filePath
            );
            return await fs.readFile(templatePath, "utf-8");
        } catch (err) {
            if (err instanceof Error) {
                error("Failed to read template from file:", err);
            } else {
                error("Failed to read template from file");
            }
        }
    }

    public async createCustomTemplate(
        name: string,
        content: string
    ): Promise<void> {}

    public async updateCustomTemplate(
        name: string,
        content: string
    ): Promise<void> {}

    public async deleteCustomTemplate(name: string): Promise<void> {}
}
