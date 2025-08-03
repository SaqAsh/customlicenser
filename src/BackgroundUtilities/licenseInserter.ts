import * as vscode from "vscode";
import { TextDocument } from "vscode";
import error from "../utils/loggers/error";
import info from "../utils/loggers/info";

export type LicenseExistenceResultType = {
	containsKeyword: boolean;
	keyword: string;
	lineNumber: number;
};

const licenseKeywords = new Set([
	"License",
	"Copyright",
	"MIT",
	"Apache",
	"GPL",
	"Licensor",
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
