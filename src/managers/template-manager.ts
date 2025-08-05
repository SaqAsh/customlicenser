import * as vscode from "vscode";

import { error, info } from "../loggers";
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

            if (existingTemplate === undefined) {
                await error(`Template "${templateName}" not found.`);
                return;
            }

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

    private processTemplateContent(content: string): string {
        let processed = content.replace(/\\n/g, "\n");

        const patterns = [
            /(Copyright[^.]*\.)/g,
            /(All rights reserved\.)/g,
            /(GNU [^.]*\.)/g,
            /(MIT [^.]*\.)/g,
            /(Apache [^.]*\.)/g,
            /(BSD [^.]*\.)/g,
            /(\.)(\s*)(This program)/g,
            /(\.)(\s*)(If not, see)/g,
            /(\.)(\s*)(THE SOFTWARE IS PROVIDED)/g,
            /(\.)(\s*)(IN NO EVENT)/g,
        ];

        patterns.forEach((pattern) => {
            processed = processed.replace(pattern, "$1\n$2$3");
        });

        processed = processed.replace(/\n{3,}/g, "\n\n");

        if (!processed.endsWith("\n")) {
            processed += "\n";
        }

        return processed;
    }
}
