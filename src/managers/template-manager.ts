import { IConfigService } from "../services/interfaces";
import { ITemplateManager } from "./interfaces/ITemplateManager";
import { ITemplateService } from "../services/interfaces/ITemplateService";
import { LicenseTemplate } from "../types";

export class TemplateManager implements ITemplateManager {
    private readonly configurationService: IConfigService;
    private readonly templateService: ITemplateService;
    private readonly allTemplates: LicenseTemplate[];

    constructor(
        templateService: ITemplateService,
        configurationService: IConfigService
    ) {
        (this.configurationService = configurationService),
            (this.templateService = templateService);
        this.allTemplates = templateService.allTemplates;
    }
    async openTemplateEditor(templateName: string): Promise<void> {}

    async handleTemplateCreation(templateName: string): Promise<void> {}

    async handleTemplateEditing(templateName: string): Promise<void> {}
}
