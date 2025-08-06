import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";

import { ERROR_MESSAGES, UI_MESSAGES } from "../constants";
import { error, info } from "../loggers";
import { ITemplateService } from "../services/interfaces/ITemplateService";
import { LicenseTemplate } from "../types";
import { ITemplateManager } from "./interfaces/ITemplateManager";

export class TemplateManager implements ITemplateManager {
	private readonly templateService: ITemplateService;
	private saveListener?: vscode.Disposable;

	constructor(templateService: ITemplateService) {
		this.templateService = templateService;
	}

	get allCustomTemplates(): LicenseTemplate[] {
		return this.templateService.allCustomTemplates;
	}

	async handleTemplateCreation(templateName: string): Promise<void> {
		try {
			const licenseFilePath = await this.createLicenseFile(
				templateName,
				""
			);
			await this.openAndListenForSave(
				licenseFilePath,
				templateName,
				true
			);
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

			const licenseFilePath = await this.createLicenseFile(
				templateName,
				existingTemplate.content
			);
			await this.openAndListenForSave(
				licenseFilePath,
				templateName,
				false
			);
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

	private async createLicenseFile(
		templateName: string,
		content: string
	): Promise<string> {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders === undefined || workspaceFolders.length === 0) {
			throw new Error("No workspace folder found");
		}

		const workspaceRoot = workspaceFolders[0].uri.fsPath;
		const vscodeFolder = path.join(workspaceRoot, ".vscode");
		const licenseFilePath = path.join(
			vscodeFolder,
			`${templateName}.license`
		);

		await fs.mkdir(vscodeFolder, { recursive: true });

		const placeholderContent = content
			? `# Enter your content below:\n\n${content}`
			: `# Enter your content below:\n\n`;

		await fs.writeFile(licenseFilePath, placeholderContent, "utf-8");
		return licenseFilePath;
	}

	private async openAndListenForSave(
		licenseFilePath: string,
		templateName: string,
		isCreating: boolean
	): Promise<void> {
		const document = await vscode.workspace.openTextDocument(
			licenseFilePath
		);
		await vscode.window.showTextDocument(document);

		this.saveListener = vscode.workspace.onDidSaveTextDocument(
			async (savedDocument) => {
				if (savedDocument.uri.fsPath === licenseFilePath) {
					try {
						const content = await fs.readFile(
							licenseFilePath,
							"utf-8"
						);
						const cleanContent = content
							.replace(/^# Enter your content below:\n\n/, "")
							.trim();

						if (!cleanContent) {
							error("License template content cannot be empty");
							return;
						}

						if (isCreating) {
							await this.templateService.createCustomTemplate(
								templateName,
								cleanContent
							);
							info(
								`${templateName} ${UI_MESSAGES.TEMPLATE_CREATED_SUCCESS}`
							);
						} else {
							await this.templateService.updateCustomTemplate(
								templateName,
								cleanContent
							);
							info(
								`${templateName} ${UI_MESSAGES.TEMPLATE_UPDATED_SUCCESS}`
							);
						}

						await this.cleanupTemplateFile(licenseFilePath);
						this.disposeSaveListener();
					} catch (err) {
						const errorMessage = isCreating
							? ERROR_MESSAGES.FAILED_TO_CREATE_TEMPLATE
							: ERROR_MESSAGES.FAILED_TO_UPDATE_TEMPLATE;
						error(
							`${errorMessage} ${
								err instanceof Error
									? err.message
									: "Unknown error"
							}`,
							err instanceof Error ? err : undefined
						);
					}
				}
			}
		);
	}

	private async cleanupTemplateFile(filePath: string): Promise<void> {
		try {
			await fs.unlink(filePath);
		} catch (err) {}
	}

	private disposeSaveListener(): void {
		if (this.saveListener) {
			this.saveListener.dispose();
			this.saveListener = undefined;
		}
	}
}
