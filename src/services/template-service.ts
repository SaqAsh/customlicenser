import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";

import { LicenseTemplatePaths } from "../constants";
import { error } from "../loggers";
import { LicenseTemplate, LicenseType } from "../types";
import { IConfigService, ITemplateService } from "./interfaces";

export class TemplateService implements ITemplateService {
    readonly currentTemplate: LicenseTemplate;
    readonly defaultLicenseTemplate: LicenseTemplate;
    readonly allCustomTemplates: LicenseTemplate[];
    readonly allTemplates: LicenseTemplate[];

    readonly configService: IConfigService;

    constructor(
        configService: IConfigService,
        currentTemplate: LicenseTemplate
    ) {
        this.configService = configService;
        this.currentTemplate = currentTemplate;
        this.defaultLicenseTemplate = this.configService.getDefaultLicense;
        this.allCustomTemplates = this.configService.allCustomTemplates;
        this.allTemplates = this.configService.allTemplates;
    }

    async getTemplate(licenseType: LicenseType): Promise<string | undefined> {
        // Check if it's a custom template first
        const customTemplate = this.allCustomTemplates.find(
            (template) => template.name === licenseType
        );

        if (customTemplate) {
            return customTemplate.content;
        }

        const filePath = LicenseTemplatePaths[licenseType];
        if (!filePath) {
            error(`No template path found for license type: ${licenseType}`);
            return undefined;
        }

        return await this.readTemplateFromFile(filePath);
    }

    private async findTemplateDirectory(): Promise<string | undefined> {
        const possiblePaths = [
            ...(vscode.extensions.getExtension("customlicenser")?.extensionPath
                ? [
                      path.join(
                          vscode.extensions.getExtension("customlicenser")!
                              .extensionPath,
                          "license-templates"
                      ),
                  ]
                : []),
            path.join(process.cwd(), "dist", "license-templates"),
            path.join(process.cwd(), "src", "license-templates"),
            path.join(__dirname, "..", "license-templates"),
            path.join(__dirname, "..", "dist", "license-templates"),
            path.join(__dirname, "..", "..", "license-templates"),
            path.join(__dirname, "..", "..", "dist", "license-templates"),
        ];

        for (const possiblePath of possiblePaths) {
            try {
                await fs.access(possiblePath);
                return possiblePath;
            } catch {
                continue;
            }
        }

        return undefined;
    }

    private async readTemplateFromFile(
        filePath: string
    ): Promise<string | undefined> {
        try {
            const templateDir = await this.findTemplateDirectory();

            if (!templateDir) {
                error("Template directory not found");
                return undefined;
            }

            const fullPath = path.join(templateDir, filePath);

            try {
                await fs.access(fullPath);
            } catch {
                error(`Template file not found: ${fullPath}`);
                return undefined;
            }

            return await fs.readFile(fullPath, "utf-8");
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Unknown error occurred";
            error(
                `Failed to read template file: ${errorMessage}`,
                err instanceof Error ? err : undefined
            );
            return undefined;
        }
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
