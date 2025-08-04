import path from "path";
import * as vscode from "vscode";
import { Uri } from "vscode";

export type FileTypeMangerReturnType = {
	fileName: string;
	fileExtension: string;
	languageID: string;
	uri: Uri;
};

/**
 * Gets information about the current active file.
 * Extracts language ID and file path from the currently active editor.
 * @returns File type information object or undefined if no active editor
 */
export const fileTypeManger = (): FileTypeMangerReturnType | undefined => {
	const editor = vscode.window.activeTextEditor;

	if (editor === undefined) {
		return undefined;
	}

	const document = editor.document;
	const fileName = document.fileName;
	const fileExtension = path.extname(fileName);
	const languageId = document.languageId;

	return {
		fileName: fileName,
		fileExtension: fileExtension,
		languageID: languageId,
		uri: document.uri,
	};
};
