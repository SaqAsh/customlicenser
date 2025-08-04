import * as vscode from "vscode";

import { licensePhrases } from "../constants/LicensePhrases";
import { skipExtensions } from "../constants/SkipExtensions";
import { CommentLookup } from "../types/CommentLookup";
import { CommentStyle } from "../types/CommentStyle";
import { FileInfo } from "../types/FileInfo";
import error from "../utils/loggers/error";
import { IFileService } from "./interfaces/IFileService";

export class FileService implements IFileService {
	private readonly editor = vscode.window.activeTextEditor;
	private readonly document = this.editor?.document;
	private readonly license: string;
	private fuse: any = null;

	constructor(license: string) {
		this.license = license;
		this.initializeFuse();
	}

	private async initializeFuse(): Promise<void> {
		const Fuse = (await import("fuse.js")).default;
		this.fuse = new Fuse(licensePhrases, {
			includeScore: true,
			threshold: 0.4,
		});
	}

	public get language(): string {
		return this.document?.languageId || "";
	}

	public get extension(): string {
		return this.document?.fileName.split(".").pop() || "";
	}

	public get fileInfo(): FileInfo {
		return {
			fileName: this.document?.fileName,
			fileExtension: this.extension,
			languageID: this.language,
			filePath: this.document?.uri.fsPath,
			uri: this.document?.uri,
		};
	}

	public get commentStyle(): CommentStyle {
		return this.language in CommentLookup
			? CommentLookup[this.language as keyof typeof CommentLookup]
			: { type: "line" };
	}

	public shouldProcessFile(filePath: string): boolean {
		const ext = filePath.split(".").pop();
		return ext ? !skipExtensions.has(ext) : true;
	}

	public async insertIntoFile(): Promise<boolean> {
		try {
			if (!this.editor || !this.document) {
				return false;
			}

			const edit = await this.editor.edit((editBuilder) => {
				editBuilder.insert(
					new vscode.Position(0, 0),
					this.license + "\n"
				);
			});

			if (edit === false) {
				return false;
			}

			await this.document.save();
			return true;
		} catch (err) {
			console.error("Error inserting license:", err);
			return false;
		}
	}

	public async hasLicense(): Promise<boolean> {
		try {
			if (!this.fuse) {
				await this.initializeFuse();
			}
			const content = this.document?.getText();
			const searchResults = this.fuse.search(content);
			return searchResults.some(
				(result: any) => result.score && result.score < 0.3
			);
		} catch (err) {
			if (err instanceof Error) {
				error("Error checking for license:", err);
			} else {
				error("Error checking for license:");
			}
			return false;
		}
	}
}
