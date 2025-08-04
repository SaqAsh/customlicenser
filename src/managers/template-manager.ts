import { ITemplateManager } from "./interfaces/ITemplateManager";

export class TemplateManager implements ITemplateManager {
    async openTemplateEditor(templateName?: string): Promise<void> {}

    async handleTemplateCreation(): Promise<void> {}

    async handleTemplateEditing(templateName: string): Promise<void> {}

    async showTemplateList(): Promise<string | undefined> {
        return undefined;
    }

    async showCustomTemplateList(): Promise<string | undefined> {
        return undefined;
    }

    validateTemplateName(name: string): boolean {
        return true;
    }

    validateTemplateContent(content: string): boolean {
        return true;
    }
}
