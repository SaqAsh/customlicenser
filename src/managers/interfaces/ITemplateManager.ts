export interface ITemplateManager {
	handleTemplateCreation(templateName: string): Promise<void>;
	handleTemplateEditing(templateName: string): Promise<void>;
}
