import * as vscode from "vscode";
import { TextDocument } from "vscode";
import error from "../utils/loggers/error";
import info from "../utils/loggers/info";

/**
 * Inserts a formatted license into the current active file.
 * Adds the license at the beginning of the file with proper spacing.
 * Automatically saves the document after insertion.
 * @param formattedLicense - The license text with proper comment formatting
 * @returns Promise resolving to true if successful, false otherwise
 */

export const insertLicenseIntoCurrentFile = async (
	formattedLicense: string
): Promise<boolean> => {
	try {
		const editor = vscode.window.activeTextEditor;

		if (editor === undefined) {
			error("No active file to add license to");
			return false;
		}

		const document = editor.document;
		const insertPosition = new vscode.Position(0, 0);
		const licenseWithBreaks = formattedLicense + "\n\n";

		await editor.edit((editBuilder) => {
			editBuilder.insert(insertPosition, licenseWithBreaks);
		});

		await document.save();

		info("License successfully added to file!");
		return true;
	} catch (err) {
		error(`Failed to insert license: ${err}`);
		return false;
	}
};

/**
 * Checks if a document already contains a license header.
 *
 * Scans the first 20 lines of the document for common license keywords
 * to determine if a license is already present.
 *
 * @param document - The VS Code text document to check
 * @param licenseKeywords - Optional array of keywords to search for (defaults to common license terms)
 * @returns True if license keywords are found, false otherwise
 */

export type LicenseExistenceResultType = {
	containsKeyword: boolean;
	keyword: string;
	lineNumber: number;
};

export type LicenseKeywords =
	| "license"
	| "copyright"
	| "mit"
	| "apache"
	| "gpl"
	| "licensor";

const licenseKeywords: Set<LicenseKeywords> = new Set([
	"license",
	"copyright",
	"mit",
	"apache",
	"gpl",
	"licensor",
]);

export const checkIfLicenseExists = (document: TextDocument) => {
	for (let i = 0; i < Math.min(20, document.lineCount); i++) {
		const line = document.lineAt(i).text.toLowerCase();
		for (const keyword of licenseKeywords) {
			if (line.includes(keyword)) {
				return { containsKeyword: true, keyword, lineNumber: i };
			}
		}
	}
	return undefined;
};

/**
 * Removes an existing license header from the current file.
 * Identifies and removes license blocks from the beginning of the file.
 * Automatically saves the document after removal.
 * @returns Promise resolving to true if successful, false otherwise
 */
export const removeLicenseFromCurrentFile = async (): Promise<boolean> => {
	try {
		const editor = vscode.window.activeTextEditor;
		if (editor === undefined) {
			vscode.window.showErrorMessage(
				"No active file to remove license from"
			);
			return false;
		}

		const document = editor.document;

		let endLine = 0;

		for (let i = 0; i < Math.min(100, document.lineCount); i++) {
			const line = document.lineAt(i).text.toLowerCase();
			for (const keyword in licenseKeywords) {
				if (line.includes(keyword)) {
					endLine = i + 1;
				}
			}
		}

		if (endLine === 0) {
			info("No license found to remove");
			return false;
		}

		// Remove the license block
		const range = new vscode.Range(0, 0, endLine, 0);
		await editor.edit((editBuilder) => {
			editBuilder.delete(range);
		});

		await document.save();
		info("License removed from file!");
		return true;
	} catch (err) {
		error(`Failed to remove license: ${err}`);
		return false;
	}
};
