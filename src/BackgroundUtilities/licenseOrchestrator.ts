import * as vscode from "vscode";
import {
	LicenseOption,
	selectLicenseToAdd,
} from "../Commands/selectLicenseToAdd";
import { determineCommentType } from "./commentTypeManger";
import {
	checkIfLicenseExists,
	insertLicenseIntoCurrentFile,
} from "./licenseInserter";
import { processLicenseTemplate, readLicenseTemplate } from "./licenseReader";

/**
 * Main orchestrator for adding licenses to the current file.
 *
 * Handles the complete workflow: license selection, template processing,
 * comment formatting, and file insertion. Includes error handling and user feedback.
 *
 * @returns Promise resolving to true if successful, false otherwise
 */
export const addLicenseToCurrentFile = async (): Promise<boolean> => {
	try {
		// Check if there's an active editor
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage("No active file to add license to");
			return false;
		}

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

		const commentType = await determineCommentType();
		if (!commentType) {
			vscode.window.showErrorMessage(
				"Unable to determine comment type for this file"
			);
			return false;
		}

		const formatComment = (text: string): string => {
			if (commentType.type === "line") {
				const lines = text.split("\n");
				return lines
					.map((line) => `${commentType.prefix}${line}`)
					.join("\n");
			} else {
				const lines = text.split("\n");
				const formattedLines = [
					commentType.start,
					...lines.map((line) => ` * ${line}`),
					` ${commentType.end}`,
				];
				return formattedLines.join("\n");
			}
		};

		// Step 2: Show license selection
		const selectedLicense = await selectLicenseToAdd();
		if (!selectedLicense) {
			return false; // User cancelled
		}

		// Step 3: Read license template
		const licenseTemplate = await readLicenseTemplate(selectedLicense);
		if (!licenseTemplate) {
			vscode.window.showErrorMessage("Failed to read license template");
			return false;
		}

		// Step 4: Process template variables
		const config = vscode.workspace.getConfiguration("customlicenser");
		const userName = config.get<string>("authorName") || "Your Name";
		const userEmail =
			config.get<string>("authorEmail") || "your.email@example.com";

		const processedTemplate = processLicenseTemplate(licenseTemplate, {
			name: userName,
			email: userEmail,
		});

		// Step 5: Format with appropriate comment style
		const formattedLicense = formatComment(processedTemplate);

		// Step 6: Insert into file
		const success = await insertLicenseIntoCurrentFile(formattedLicense);
		return success;
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to add license: ${error}`);
		return false;
	}
};

/**
 * Adds a specific license type to the current file.
 *
 * Bypasses license selection and directly adds the specified license type
 * with proper formatting for the current file's language.
 *
 * @param licenseType - The specific license type to add (e.g., "MIT", "Apache")
 * @returns Promise resolving to true if successful, false otherwise
 */
export const addSpecificLicenseToCurrentFile = async (
	licenseType: string
): Promise<boolean> => {
	try {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage("No active file to add license to");
			return false;
		}

		// Create a license option based on the type
		const licenseOption: LicenseOption = {
			label: `${licenseType} License`,
			description: `Add ${licenseType} license`,
			type: licenseType as any,
			filename: `${licenseType}.txt`,
		};

		// Get comment type
		const commentType = await determineCommentType();
		if (!commentType) {
			vscode.window.showErrorMessage(
				"Unable to determine comment type for this file"
			);
			return false;
		}

		// Create format function based on comment type
		const formatComment = (text: string): string => {
			if (commentType.type === "line") {
				const lines = text.split("\n");
				return lines
					.map((line) => `${commentType.prefix}${line}`)
					.join("\n");
			} else {
				// commentType.type === "block" - format with proper line-by-line structure
				const lines = text.split("\n");
				const formattedLines = [
					commentType.start,
					...lines.map((line) => ` * ${line}`),
					` ${commentType.end}`,
				];
				return formattedLines.join("\n");
			}
		};

		// Read and process license
		const licenseTemplate = await readLicenseTemplate(licenseOption);
		if (!licenseTemplate) {
			vscode.window.showErrorMessage(
				`Failed to read ${licenseType} license template`
			);
			return false;
		}

		const config = vscode.workspace.getConfiguration("customlicenser");
		const userName = config.get<string>("authorName") || "Your Name";
		const userEmail =
			config.get<string>("authorEmail") || "your.email@example.com";

		const processedTemplate = processLicenseTemplate(licenseTemplate, {
			name: userName,
			email: userEmail,
		});

		const formattedLicense = formatComment(processedTemplate);
		const success = await insertLicenseIntoCurrentFile(formattedLicense);
		return success;
	} catch (error) {
		vscode.window.showErrorMessage(
			`Failed to add ${licenseType} license: ${error}`
		);
		return false;
	}
};
