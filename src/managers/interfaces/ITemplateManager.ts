export interface ITemplateManager {
	openTemplateEditor(templateName?: string): Promise<void>;
	handleTemplateCreation(): Promise<void>;
	handleTemplateEditing(templateName: string): Promise<void>;

	showTemplateList(): Promise<string | undefined>;
	showCustomTemplateList(): Promise<string | undefined>;

	validateTemplateName(name: string): boolean;
	validateTemplateContent(content: string): boolean;
}
