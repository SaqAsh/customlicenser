import * as vscode from "vscode";

import { CommentStyle } from "../types/CommentStyle";
import { FileInfo } from "../types/FileInfo";
import { IFileService } from "./interfaces/IFileService";

export class FileService implements IFileService {
	public get getFileLanguage(): string {
		return "";
	}
	public get getFileExtension(): string {
		return "";
	}
	public get getFileInfo(): FileInfo {
		return undefined;
	}

	public shouldProcessFile(filePath: string): boolean {
		return false;
	}

	public insertIntoFile(
		document: vscode.TextDocument,
		text: string
	): Promise<boolean> {
		return true;
	}

	public formatLicenseForLanguage(
		template: string,
		language: string
	): string {
		return "";
	}

	public get getCommentStyleForLanguage(): CommentStyle {
		return "";
	}
}
