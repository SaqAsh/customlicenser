import * as vscode from "vscode";

import { licensePhrases, skipExtensions } from "../constants";
import { CommentLookup, CommentStyle, FileInfo } from "../types";
import { error } from "../loggers";
import { IFileService } from "./interfaces";

export class FileService implements IFileService {
	constructor() {
		// No async initialization needed
	}

	// Get current active editor dynamically
	private get currentEditor(): vscode.TextEditor | undefined {
		return vscode.window.activeTextEditor;
	}

	// Get current document dynamically
	private get currentDocument(): vscode.TextDocument | undefined {
		return this.currentEditor?.document;
	}

	// Get current file path dynamically
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
		// Don't process template editor documents (plaintext language)
		if (this.language === "plaintext") {
			return false;
		}

		const ext = this.currentFilePath?.split(".").pop();
		return ext ? !skipExtensions.has(ext) : true;
	}

	public async insertIntoFile(license: string): Promise<boolean> {
		try {
			console.log(
				`FileService: Attempting to insert license, editor: ${!!this
					.currentEditor}, document: ${!!this.currentDocument}`
			);

			if (!this.currentEditor || !this.currentDocument) {
				console.log("FileService: No editor or document available");
				return false;
			}

			// Check if editor is still active and document is not closed
			if (
				!this.currentEditor.document ||
				this.currentEditor.document.isClosed
			) {
				console.log("FileService: Document is closed or not available");
				return false;
			}

			console.log(
				`FileService: Document language: ${this.currentEditor.document.languageId}, file: ${this.currentEditor.document.fileName}`
			);

			const edit = await this.currentEditor.edit((editBuilder) => {
				editBuilder.insert(new vscode.Position(0, 0), license + "\n");
			});

			console.log(`FileService: Edit result: ${edit}`);

			if (edit === false) {
				console.log("FileService: Edit operation failed");
				return false;
			}

			const saved = await this.currentDocument.save();
			console.log(`FileService: Save result: ${saved}`);

			if (!saved) {
				error("Failed to save document after inserting license");
				return false;
			}

			return saved;
		} catch (err) {
			console.error("FileService: Error inserting license:", err);
			return false;
		}
	}

	public async hasLicense(): Promise<boolean> {
		try {
			const content = this.currentDocument?.getText();
			if (!content) {
				console.log(
					"FileService: No content available for license detection"
				);
				return false;
			}

			// Simple regex matching for license detection
			const licenseRegex = new RegExp(licensePhrases.join("|"), "i");

			const hasLicense = licenseRegex.test(content);

			console.log(
				`FileService: Simple regex license detection result: ${hasLicense}`
			);

			return hasLicense;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Unknown error occurred";
			console.error("FileService: Error in hasLicense:", err);
			error(
				`Error checking for license: ${errorMessage}`,
				err instanceof Error ? err : undefined
			);
			return false;
		}
	}
}
