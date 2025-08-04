import * as vscode from "vscode";

import { error, info, warn } from "../loggers";
import { ITemplateService } from "../services/interfaces/ITemplateService";
import { ITemplateManager } from "./interfaces/ITemplateManager";

export class TemplateManager implements ITemplateManager {
	private readonly templateService: ITemplateService;

	constructor(templateService: ITemplateService) {
		this.templateService = templateService;
	}

	async openTemplateEditor(templateName: string): Promise<void> {
		try {
			const existingTemplate =
				this.templateService.allCustomTemplates.find(
					(template) => template.name === templateName
				);

			const initialContent = existingTemplate?.content || "";

			const document = await vscode.workspace.openTextDocument({
				content: initialContent,
				language: "plaintext",
			});

			await vscode.window.showTextDocument(document);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Unknown error occurred";
			await error(
				`Failed to open template editor: ${errorMessage}`,
				err instanceof Error ? err : undefined
			);
		}
	}

	async handleTemplateCreation(templateName: string): Promise<void> {
		try {
			const document = await vscode.workspace.openTextDocument({
				content: "",
				language: "plaintext",
			});

			await vscode.window.showTextDocument(document);

			await info(
				`Please enter your template content for "${templateName}" and save the document when done.`
			);

			const saveDisposable = vscode.workspace.onDidSaveTextDocument(
				async (savedDocument) => {
					if (savedDocument === document) {
						const templateContent = document.getText();

						if (templateContent.trim()) {
							await this.templateService.createCustomTemplate(
								templateName,
								templateContent
							);
							await info(
								`Template "${templateName}" created successfully!`
							);
						} else {
							await warn("Template content cannot be empty.");
						}

						saveDisposable.dispose();
					}
				}
			);

			const closeDisposable = vscode.window.onDidChangeActiveTextEditor(
				async (activeEditor) => {
					if (!activeEditor || activeEditor.document !== document) {
						await info("Template creation cancelled.");
						closeDisposable.dispose();
						saveDisposable.dispose();
					}
				}
			);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Unknown error occurred";
			await error(
				`Failed to create template: ${errorMessage}`,
				err instanceof Error ? err : undefined
			);
		}
	}

	async handleTemplateEditing(templateName: string): Promise<void> {
		try {
			const existingTemplate =
				this.templateService.allCustomTemplates.find(
					(template) => template.name === templateName
				);

			if (!existingTemplate) {
				await error(`Template "${templateName}" not found.`);
				return;
			}

			const document = await vscode.workspace.openTextDocument({
				content: existingTemplate.content,
				language: "plaintext",
			});

			await vscode.window.showTextDocument(document);

			await info(
				`Please edit your template content for "${templateName}" and save the document when done.`
			);

			const saveDisposable = vscode.workspace.onDidSaveTextDocument(
				async (savedDocument) => {
					if (savedDocument === document) {
						const templateContent = document.getText();

						if (templateContent.trim()) {
							await this.templateService.updateCustomTemplate(
								templateName,
								templateContent
							);
							await info(
								`Template "${templateName}" updated successfully!`
							);
						} else {
							await warn("Template content cannot be empty.");
						}

						saveDisposable.dispose();
					}
				}
			);

			const closeDisposable = vscode.window.onDidChangeActiveTextEditor(
				async (activeEditor) => {
					if (!activeEditor || activeEditor.document !== document) {
						await info("Template editing cancelled.");
						closeDisposable.dispose();
						saveDisposable.dispose();
					}
				}
			);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Unknown error occurred";
			await error(
				`Failed to edit template: ${errorMessage}`,
				err instanceof Error ? err : undefined
			);
		}
	}
}
