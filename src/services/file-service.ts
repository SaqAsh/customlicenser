import * as vscode from "vscode";

import {
	licensePhrases,
	skipExtensions,
	skipLanguages,
	ERROR_MESSAGES,
} from "../constants";
import { error } from "../loggers";
import { CommentLookup, CommentStyle, FileInfo } from "../types";
import { IFileService } from "./interfaces";

export class FileService implements IFileService {
	private get currentEditor(): vscode.TextEditor | undefined {
		return vscode.window.activeTextEditor;
	}

	private get currentDocument(): vscode.TextDocument | undefined {
		return this.currentEditor?.document;
	}

	private get currentFilePath(): string | undefined {
		return this.currentDocument?.uri.fsPath;
	}

	public get language(): string {
		return this.currentDocument?.languageId || "";
	}

	public get extension(): string {
		return this.currentDocument?.fileName.split(".").pop() || "";
	}

	public get fileInfo(): FileInfo {
		return {
			fileName: this.currentDocument?.fileName,
			fileExtension: this.extension,
			languageID: this.language,
			filePath: this.currentFilePath,
			uri: this.currentDocument?.uri,
		};
	}

	public get commentStyle(): CommentStyle {
		return this.language in CommentLookup
			? CommentLookup[this.language as keyof typeof CommentLookup]
			: { type: "line" };
	}

	public shouldProcessFile(): boolean {
		if (skipLanguages.has(this.language)) {
			return false;
		}

		const ext = this.currentFilePath?.split(".").pop();
		return ext ? !skipExtensions.has(ext) : true;
	}

	public async insertIntoFile(license: string): Promise<boolean> {
		try {
			if (!this.currentEditor || !this.currentDocument) {
				return false;
			}

			if (
				!this.currentEditor.document ||
				this.currentEditor.document.isClosed
			) {
				return false;
			}

			const edit = await this.currentEditor.edit((editBuilder) => {
				editBuilder.insert(new vscode.Position(0, 0), license + "\n\n");
			});

			if (edit === false) {
				return false;
			}

			const saved = await this.currentDocument.save();

			if (!saved) {
				error(ERROR_MESSAGES.FAILED_TO_SAVE_DOCUMENT);
				return false;
			}

			return saved;
		} catch (err) {
			error(
				`${ERROR_MESSAGES.ERROR_INSERTING_LICENSE} ${
					err instanceof Error
						? err.message
						: "Unknown error occurred"
				}`,
				err instanceof Error ? err : undefined
			);
			return false;
		}
	}

	public async hasLicense(): Promise<boolean> {
		try {
			const content = this.currentDocument?.getText();
			if (content === undefined) {
				return false;
			}

			const licenseRegex = new RegExp(licensePhrases.join("|"), "i");
			const hasLicense = licenseRegex.test(content);

			return hasLicense;
		} catch (err) {
			error(
				`${ERROR_MESSAGES.ERROR_CHECKING_LICENSE} ${
					err instanceof Error
						? err.message
						: "Unknown error occurred"
				}`,
				err instanceof Error ? err : undefined
			);
			return false;
		}
	}
}
