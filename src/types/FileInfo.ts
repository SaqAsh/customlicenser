import * as vscode from "vscode";

export interface FileInfo {
	fileName: string;
	fileExtension: string;
	languageID: string;
	filePath: string;
	uri: vscode.Uri;
}
