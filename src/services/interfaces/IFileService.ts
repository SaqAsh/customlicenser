import * as vscode from "vscode";

import { FileInfo } from "../../types/FileInfo";
import { CommentStyle } from "../../types/CommentStyle";

export interface IFileService {
	getFileLanguage: string;
	getFileExtension: string;
	getFileInfo: FileInfo;

	shouldProcessFile(filePath: string): boolean;

	insertIntoFile(
		document: vscode.TextDocument,
		text: string
	): Promise<boolean>;

	formatLicenseForLanguage(template: string, language: string): string;
	getCommentStyleForLanguage: CommentStyle;
}
