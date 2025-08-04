export interface ITemplateManager {
    openTemplateEditor(templateName?: string): Promise<void>;
    handleTemplateCreation(templateName: string): Promise<void>;
    handleTemplateEditing(templateName: string): Promise<void>;
}
