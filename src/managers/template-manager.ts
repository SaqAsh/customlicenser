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
			console.log(
				`TemplateManager: Starting template creation for "${templateName}"`
			);

			// Get template content from user input with multi-line support
			const templateContent = await vscode.window.showInputBox({
				prompt: `Enter the content for your "${templateName}" template`,
				placeHolder:
					"Enter your license template content here... (newlines will be auto-detected)",
				ignoreFocusOut: true,
				validateInput: (value) => {
					if (!value || value.trim().length === 0) {
						return "Template content cannot be empty";
					}
					return null;
				},
			});

			if (templateContent) {
				try {
					// Smart newline detection and processing
					const processedContent =
						this.processTemplateContent(templateContent);

					await this.templateService.createCustomTemplate(
						templateName,
						processedContent
					);
					await info(
						`Template "${templateName}" created successfully!`
					);
				} catch (err) {
					console.error(
						"TemplateManager: Failed to create template:",
						err
					);
					await error(
						`Failed to create template: ${
							err instanceof Error ? err.message : "Unknown error"
						}`
					);
				}
			} else {
				await info("Template creation cancelled.");
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Unknown error occurred";
			console.error(
				`TemplateManager: Error in handleTemplateCreation:`,
				err
			);
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

			// Get updated template content from user input
			const templateContent = await vscode.window.showInputBox({
				prompt: `Edit the content for "${templateName}" template`,
				placeHolder:
					"Enter your updated license template content... (newlines will be auto-detected)",
				value: existingTemplate.content,
				ignoreFocusOut: true,
				validateInput: (value) => {
					if (!value || value.trim().length === 0) {
						return "Template content cannot be empty";
					}
					return null;
				},
			});

			if (templateContent) {
				try {
					// Smart newline detection and processing
					const processedContent =
						this.processTemplateContent(templateContent);

					await this.templateService.updateCustomTemplate(
						templateName,
						processedContent
					);
					await info(
						`Template "${templateName}" updated successfully!`
					);
				} catch (err) {
					console.error(
						"TemplateManager: Failed to update template:",
						err
					);
					await error(
						`Failed to update template: ${
							err instanceof Error ? err.message : "Unknown error"
						}`
					);
				}
			} else {
				await info("Template editing cancelled.");
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Unknown error occurred";
			await error(
				`Failed to edit template: ${errorMessage}`,
				err instanceof Error ? err : undefined
			);
		}
	}

	/**
	 * Smart template content processing that auto-detects and handles newlines
	 */
	private processTemplateContent(content: string): string {
		// First, normalize any existing \n sequences
		let processed = content.replace(/\\n/g, "\n");

		// Auto-detect common patterns that should have newlines
		// Look for patterns like "Copyright...\n\nThis program..." or similar
		const patterns = [
			// Add newline after copyright statements
			/(Copyright[^.]*\.)/g,
			// Add newline after "All rights reserved"
			/(All rights reserved\.)/g,
			// Add newline after license name mentions
			/(GNU [^.]*\.)/g,
			/(MIT [^.]*\.)/g,
			/(Apache [^.]*\.)/g,
			/(BSD [^.]*\.)/g,
			// Add newline before "This program" or similar
			/(\.)(\s*)(This program)/g,
			// Add newline before "If not, see"
			/(\.)(\s*)(If not, see)/g,
			// Add newline before "THE SOFTWARE IS PROVIDED"
			/(\.)(\s*)(THE SOFTWARE IS PROVIDED)/g,
			// Add newline before "IN NO EVENT"
			/(\.)(\s*)(IN NO EVENT)/g,
		];

		// Apply patterns to add newlines where appropriate
		patterns.forEach((pattern) => {
			processed = processed.replace(pattern, "$1\n$2$3");
		});

		// Clean up multiple consecutive newlines (keep max 2)
		processed = processed.replace(/\n{3,}/g, "\n\n");

		// Ensure there's a newline at the end
		if (!processed.endsWith("\n")) {
			processed += "\n";
		}

		return processed;
	}
}
