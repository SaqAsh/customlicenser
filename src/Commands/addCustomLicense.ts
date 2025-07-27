import * as vscode from "vscode";
import { determineCommentType } from "../BackgroundUtilities/commentTypeManger";
import {
	insertLicenseIntoCurrentFile,
	checkIfLicenseExists,
} from "../BackgroundUtilities/licenseInserter";

/**
 * Prompts user for custom license text and adds it to the current file.
 *
 * Handles custom license creation, validation, and formatting with appropriate
 * comment style for the current file's language.
 *
 * @returns Promise resolving to true if successful, false otherwise
 */
export const addCustomLicense = async (): Promise<boolean> => {
	try {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage("No active file to add license to");
			return false;
		}

		// Check if license already exists
		if (checkIfLicenseExists(editor.document)) {
			const overwrite = await vscode.window.showWarningMessage(
				"A license may already exist in this file. Do you want to add another one?",
				"Yes",
				"No"
			);
			if (overwrite !== "Yes") {
				return false;
			}
		}

		// Get custom license text from user
		const customLicenseText = await vscode.window.showInputBox({
			prompt: "Enter your custom license text",
			placeHolder: "Copyright (c) 2024 Your Name. All rights reserved.",
			ignoreFocusOut: true,
			validateInput: (value) => {
				if (!value || value.trim().length === 0) {
					return "License text cannot be empty";
				}
				return null;
			},
		});

		if (!customLicenseText) {
			return false; // User cancelled
		}

		// Get comment type for current file
		const commentType = await determineCommentType();
		if (!commentType) {
			vscode.window.showErrorMessage(
				"Unable to determine comment type for this file"
			);
			return false;
		}

		// Format license with appropriate comment style
		let formattedLicense: string;
		if (commentType.type === "line") {
			const lines = customLicenseText.split("\n");
			formattedLicense = lines
				.map((line) => `${commentType.prefix}${line}`)
				.join("\n");
		} else {
			// commentType.type === "block" - format with proper line-by-line structure
			const lines = customLicenseText.split("\n");
			const formattedLines = [
				commentType.start,
				...lines.map((line) => ` * ${line}`),
				` ${commentType.end}`,
			];
			formattedLicense = formattedLines.join("\n");
		}

		// Insert into file
		const success = await insertLicenseIntoCurrentFile(formattedLicense);
		return success;
	} catch (error) {
		vscode.window.showErrorMessage(
			`Failed to add custom license: ${error}`
		);
		return false;
	}
};
