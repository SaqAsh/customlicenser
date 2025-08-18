import * as vscode from "vscode";

import { TextEditorEdit } from "vscode";
import {
	ERROR_MESSAGES,
	licensePhrases,
	skipExtensions,
	skipLanguages,
} from "../constants";
import { error } from "../loggers";
import {
	CommentLookup,
	CommentStyle,
	ExtractedLicense,
	FileInfo,
} from "../types";
import { removeLicense } from "../utils/remove-license";
import { typoDetector } from "../utils/typo-detection";
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

	public async insertIntoFile(
		license: string
	): Promise<Result<boolean, Error>> {
		if (
			!this.currentEditor?.document ||
			!this.currentDocument ||
			this.currentEditor.document?.isClosed
		) {
			error("File service: No active editor or document is closed");
			return [null, new Error("No active editor or document is closed")];
		}

		const editPromise = Promise.resolve(
			this.currentEditor.edit((editBuilder: TextEditorEdit) => {
				editBuilder.insert(new vscode.Position(0, 0), license + "\n\n");
			})
		);

		const savePromise = Promise.resolve(this.currentDocument.save());

		const [edit, editError] = await tryCatch(editPromise);

		if (editError) {
			return [null, editError];
		}

		if (edit === false) {
			error("File service: Failed to edit document");
			return [null, new Error("Failed to edit document")];
		}

		const [saved, saveError] = await tryCatch(savePromise);

		if (saveError) {
			return [null, saveError];
		}

		if (!saved) {
			error(`File service: ${ERROR_MESSAGES.FAILED_TO_SAVE_DOCUMENT}`);
			return [null, new Error(ERROR_MESSAGES.FAILED_TO_SAVE_DOCUMENT)];
		}

		return [saved, null];
	}

	public async replaceLicense(
		extractedLicense: ExtractedLicense,
		newLicense: string
	): Promise<Result<boolean, Error>> {
		if (
			!this.currentEditor?.document ||
			!this.currentDocument ||
			this.currentEditor.document?.isClosed
		) {
			error(
				"File service: No active editor or document is closed (replaceLicense)"
			);
			return [null, new Error("No active editor or document is closed")];
		}

		const textEdit = removeLicense(extractedLicense, newLicense);

		const editPromise = Promise.resolve(
			this.currentEditor.edit((editBuilder) => {
				editBuilder.replace(textEdit.range, textEdit.newText);
			})
		);

		const savePromise = Promise.resolve(this.currentDocument.save());

		const [edit, editError] = await tryCatch(editPromise);

		if (editError) {
			return [null, editError];
		}

		if (edit === false) {
			error("File service: Failed to replace license");
			return [null, new Error("Failed to replace license")];
		}

		const [saved, saveError] = await tryCatch(savePromise);

		if (saveError) {
			return [null, saveError];
		}

		if (!saved) {
			error(`File service: ${ERROR_MESSAGES.FAILED_TO_SAVE_DOCUMENT}`);
			return [null, new Error(ERROR_MESSAGES.FAILED_TO_SAVE_DOCUMENT)];
		}

		return [saved, null];
	}

	public async hasTypo(
		extractedLicense: string,
		defaultTemplate: string
	): Promise<Result<boolean, Error>> {
		if (!extractedLicense || !defaultTemplate) {
			error(
				`File service: hasTypo - Missing content: extractedLicense=${!!extractedLicense}, defaultTemplate=${!!defaultTemplate}`
			);
			return [false, null];
		}

		// Normalize both strings for comparison to reduce false positives
		const normalizeString = (str: string) => {
			return str
				.trim()
				.replace(/\s+/g, " ") // Replace multiple spaces with single space
				.replace(/\r\n/g, "\n") // Normalize line endings
				.replace(/\/\*\s*\*\//g, "") // Remove empty comment blocks
				.toLowerCase();
		};

		const normalizedExtracted = normalizeString(extractedLicense);
		const normalizedTemplate = normalizeString(defaultTemplate);

		const distance = typoDetector(normalizedTemplate, normalizedExtracted);
		const threshold = 0;
		const hasTypo = distance > threshold;

		return [hasTypo, null];
	}

	public async hasLicense(): Promise<Result<boolean, Error>> {
		const contentPromise = Promise.resolve(this.currentDocument?.getText());
		const [content, contentError] = await tryCatch(contentPromise);

		if (contentError) {
			return [null, contentError];
		}

		if (content === undefined) {
			error("File service: Document content is undefined");
			return [null, new Error("content is undefined")];
		}

		const licenseRegex = new RegExp(licensePhrases.join("|"), "i");
		const hasLicense = licenseRegex.test(content);

		return [hasLicense, null];
	}

	public extractLicense(content: string): ExtractedLicense | null {
		const lines = content.split("\n");
		const commentInfo = this.commentStyle;

		switch (commentInfo.type) {
			case "block":
				if (commentInfo.start && commentInfo.end) {
					return this.extractBlockLicense(
						lines,
						commentInfo.start,
						commentInfo.end
					);
				}
				return null;
			case "line":
				if (commentInfo.prefix) {
					return this.extractLineLicense(lines, commentInfo.prefix);
				}
				return null;
			default:
				return null;
		}
	}

	private extractBlockLicense(
		lines: string[],
		startToken: string,
		endToken: string
	): ExtractedLicense | null {
		let i = 0;
		const len = lines.length;
		let startingLine = -1;
		let endingLine = -1;
		let licenseContent = "";

		// Find the start of the license block
		while (i < len) {
			const line = lines[i].trim();
			if (line.includes(startToken)) {
				startingLine = i;
				break;
			}
			i++;
		}

		if (startingLine === -1) {
			return null;
		}

		// Extract license content until we find the end token
		let currentLine = startingLine;
		let foundEnd = false;

		while (currentLine < len && !foundEnd) {
			const line = lines[currentLine];
			licenseContent += line;

			// Check if this line contains the end token
			if (line.includes(endToken)) {
				endingLine = currentLine;
				foundEnd = true;
			} else {
				licenseContent += "\n";
			}

			currentLine++;
		}

		if (!foundEnd || endingLine === -1) {
			return null;
		}

		return {
			content: licenseContent,
			startingLine,
			endingLine,
		};
	}

	private extractLineLicense(
		lines: string[],
		prefix: string
	): ExtractedLicense | null {
		let startingLine = -1;
		let endingLine = -1;
		let licenseContent = "";
		let i = 0;
		const len = lines.length;

		// Find the start of the license (first line with comment prefix)
		while (i < len) {
			const line = lines[i].trim();
			if (line.startsWith(prefix)) {
				startingLine = i;
				break;
			}
			i++;
		}

		if (startingLine === -1) {
			return null;
		}

		// Extract consecutive comment lines
		let currentLine = startingLine;
		while (currentLine < len) {
			const line = lines[currentLine];
			const trimmedLine = line.trim();

			// If line starts with comment prefix or is just the comment character (empty comment line), it's part of the license
			if (
				trimmedLine.startsWith(prefix) ||
				trimmedLine === prefix.trim()
			) {
				licenseContent += line;
				if (currentLine < len - 1) {
					licenseContent += "\n";
				}
				endingLine = currentLine;
				currentLine++;
			} else if (trimmedLine === "") {
				// Empty line might be part of license block, peek ahead
				const nextLine = currentLine + 1;
				if (
					nextLine < len &&
					lines[nextLine].trim().startsWith(prefix)
				) {
					licenseContent += line + "\n";
					currentLine++;
				} else {
					// End of license block
					break;
				}
			} else {
				// Non-comment line, end of license
				break;
			}
		}

		return {
			content: licenseContent,
			startingLine,
			endingLine,
		};
	}
}
