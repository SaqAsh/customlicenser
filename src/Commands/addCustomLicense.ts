import * as vscode from "vscode";

import { determineCommentType } from "../BackgroundUtilities/commentTypeManger";
import {
	checkIfLicenseExists,
	insertLicenseIntoCurrentFile,
} from "../BackgroundUtilities/licenseInserter";

import { fileTypeManger } from "../BackgroundUtilities/fileTypeManager";
import {
	blockFormatLicense,
	lineFormatLicense,
} from "../utils/licenseFormatters";
import error from "../utils/loggers/error";
import info from "../utils/loggers/info";
import warn from "../utils/loggers/warn";

export interface CustomLicense {
	name: string;
	content: string;
	id: string;
}

/**
 * Creates an empty file for user to paste custom license, saves it to config,
 * and adds it to the current file. Uses VS Code APIs for document management,
 * configuration storage, and file editing.
 * @returns Promise resolving to true if successful, false otherwise
 */
export const addCustomLicense = async (): Promise<boolean> => {
	try {
		const editor = vscode.window.activeTextEditor;
		if (editor === undefined) {
			error("No active file to add license to");
			return false;
		}

		if (checkIfLicenseExists(editor.document) !== undefined) {
			const overwrite = await warn(
				"A license may already exist in this file. Do you want to add another one?",
				[{ title: "Yes" }, { title: "No" }]
			);
			if (overwrite?.title !== "Yes") {
				info("Custom license addition cancelled");
				return false;
			}
		}

		// Create empty document for user to paste license content
		const licenseContent = `Paste your custom license text here.
Replace this placeholder text with your license content.
Save this file when you're done (Ctrl+S / Cmd+S).

Example:
Copyright (c) 2024 Your Name
Permission is hereby granted...`;

		const tempDoc = await vscode.workspace.openTextDocument({
			content: licenseContent,
			language: "plaintext",
		});

		// Open the document for editing
		const tempEditor = await vscode.window.showTextDocument(tempDoc, {
			viewColumn: vscode.ViewColumn.Beside,
			preview: false,
		});

		// Show instructions to user
		vscode.window.showInformationMessage(
			"Paste your license content in the new document and save it (Ctrl+S/Cmd+S) to continue.",
			{ modal: false }
		);

		// Set up save listener
		const disposable = vscode.workspace.onDidSaveTextDocument(
			async (savedDoc) => {
				if (savedDoc === tempDoc) {
					disposable.dispose(); // Remove listener

					const licenseText = savedDoc.getText().trim();

					// Skip if user didn't replace placeholder
					if (
						licenseText.includes(
							"Paste your custom license text here"
						) ||
						licenseText.length === 0
					) {
						vscode.window.showWarningMessage(
							"Please replace the placeholder text with your actual license content."
						);
						return;
					}

					// Get license name from user
					const licenseName = await vscode.window.showInputBox({
						prompt: "Enter a name for this custom license",
						placeHolder: "My Custom License",
						ignoreFocusOut: true,
						validateInput: (value) => {
							if (!value || value.trim().length === 0) {
								return "License name cannot be empty";
							}
							return null;
						},
					});

					if (!licenseName) {
						vscode.window.showWarningMessage(
							"License creation cancelled."
						);
						return;
					}

					// Save to configuration
					const success = await saveCustomLicenseToConfig(
						licenseName.trim(),
						licenseText
					);
					if (!success) {
						return;
					}

					// Apply license to current file
					const applied = await applyLicenseToCurrentFile(
						licenseText
					);

					// Close temp document
					await vscode.commands.executeCommand(
						"workbench.action.closeActiveEditor"
					);

					if (applied) {
						vscode.window.showInformationMessage(
							`Custom license "${licenseName}" saved and applied successfully!`
						);
					}
				}
			}
		);

		return true;
	} catch (err) {
		if (err instanceof Error) {
			error("Failed to add custom license", err);
		}
		return false;
	}
};

/**
 * Saves a custom license to VS Code workspace configuration.
 * @param name - Display name for the license
 * @param content - License text content
 * @returns Promise resolving to true if successful, false otherwise
 */
const saveCustomLicenseToConfig = async (
	name: string,
	content: string
): Promise<boolean> => {
	try {
		const config = vscode.workspace.getConfiguration("customlicenser");
		const existingLicenses =
			config.get<CustomLicense[]>("customLicenses") || [];

		const newLicense: CustomLicense = {
			name,
			content,
			id: Date.now().toString(),
		};

		const updatedLicenses = [...existingLicenses, newLicense];

		await config.update(
			"customLicenses",
			updatedLicenses,
			vscode.ConfigurationTarget.Workspace
		);

		return true;
	} catch (err) {
		error(
			"Failed to save custom license to configuration",
			err instanceof Error ? err : new Error(String(err))
		);
		return false;
	}
};

/**
 * Applies license text to the current active file with proper formatting.
 * @param licenseText - Raw license text to apply
 * @returns Promise resolving to true if successful, false otherwise
 */
const applyLicenseToCurrentFile = async (
	licenseText: string
): Promise<boolean> => {
	try {
		const commentType = await determineCommentType();
		if (commentType === undefined) {
			error("Unable to determine comment type for this file");
			return false;
		}

		const languageId = fileTypeManger()?.languageID.toLowerCase() ?? "c";

		const formattedLicense =
			commentType.type === "line"
				? lineFormatLicense(licenseText, languageId)
				: blockFormatLicense(licenseText, languageId);

		return await insertLicenseIntoCurrentFile(formattedLicense);
	} catch (err) {
		error(
			"Failed to apply license to current file",
			err instanceof Error ? err : new Error(String(err))
		);
		return false;
	}
};
