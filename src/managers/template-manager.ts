import * as vscode from "vscode";

import {
	ERROR_MESSAGES,
	LANGUAGE_PLAINTEXT,
	UI_MESSAGES,
	VALIDATION_MESSAGES,
} from "../constants";
import { error, info } from "../loggers";
import { ITemplateService } from "../services/interfaces/ITemplateService";
import { LicenseTemplate } from "../types";
import { ITemplateManager } from "./interfaces/ITemplateManager";

export class TemplateManager implements ITemplateManager {
	private readonly templateService: ITemplateService;

	constructor(templateService: ITemplateService) {
		this.templateService = templateService;
	}

	get allCustomTemplates(): LicenseTemplate[] {
		return this.templateService.allCustomTemplates;
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
				language: LANGUAGE_PLAINTEXT,
			});

			await vscode.window.showTextDocument(document);
		} catch (err) {
			error(
				`${ERROR_MESSAGES.FAILED_TO_OPEN_EDITOR} ${
					err instanceof Error
						? err.message
						: "Unknown error occurred"
				}`,
				err instanceof Error ? err : undefined
			);
		}
	}

	async handleTemplateCreation(templateName: string): Promise<void> {
		try {
			const templateContent = await vscode.window.showInputBox({
				prompt: `Enter the content for your "${templateName}" template`,
				placeHolder: "Enter your license template content here...",
				ignoreFocusOut: true,
				validateInput: (value) => {
					if (!value || value.trim().length === 0) {
						return VALIDATION_MESSAGES.TEMPLATE_CONTENT_EMPTY;
					}
					return null;
				},
			});

			if (!templateContent) {
				info(UI_MESSAGES.TEMPLATE_CREATION_CANCELLED);
				return;
			}

			try {
				await this.templateService.createCustomTemplate(
					templateName,
					templateContent
				);
				info(`${templateName} ${UI_MESSAGES.TEMPLATE_CREATED_SUCCESS}`);
			} catch (err) {
				error(
					`${ERROR_MESSAGES.FAILED_TO_CREATE_TEMPLATE} ${
						err instanceof Error ? err.message : "Unknown error"
					}`,
					err instanceof Error ? err : undefined
				);
			}
		} catch (err) {
			error(
				`${ERROR_MESSAGES.FAILED_TO_CREATE_TEMPLATE} ${
					err instanceof Error
						? err.message
						: "Unknown error occurred"
				}`,
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

			if (existingTemplate === undefined) {
				error(`Template "${templateName}" not found.`);
				return;
			}

			const templateContent = await vscode.window.showInputBox({
				prompt: `Edit the content for "${templateName}" template`,
				placeHolder: "Enter your updated license template content...",
				value: existingTemplate.content,
				ignoreFocusOut: true,
				validateInput: (value) => {
					if (!value || value.trim().length === 0) {
						return VALIDATION_MESSAGES.TEMPLATE_CONTENT_EMPTY;
					}
					return null;
				},
			});

			if (!templateContent) {
				info(UI_MESSAGES.TEMPLATE_EDITING_CANCELLED);
				return;
			}

			try {
				await this.templateService.updateCustomTemplate(
					templateName,
					templateContent
				);
				info(`${templateName} ${UI_MESSAGES.TEMPLATE_UPDATED_SUCCESS}`);
			} catch (err) {
				error(
					`${ERROR_MESSAGES.FAILED_TO_UPDATE_TEMPLATE} ${
						err instanceof Error ? err.message : "Unknown error"
					}`,
					err instanceof Error ? err : undefined
				);
			}
		} catch (err) {
			error(
				`${ERROR_MESSAGES.FAILED_TO_EDIT_TEMPLATE} ${
					err instanceof Error
						? err.message
						: "Unknown error occurred"
				}`,
				err instanceof Error ? err : undefined
			);
		}
	}
}
