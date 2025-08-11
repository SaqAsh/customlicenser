import * as vscode from "vscode";

import {
	ERROR_MESSAGES,
	licensePhrases,
	skipExtensions,
	skipLanguages,
} from "../constants";
import { CommentLookup, CommentStyle, FileInfo } from "../types";
import { IFileService } from "./interfaces";
import { IConfigService } from "./interfaces/IConfigService";
export class FileService implements IFileService {
	private readonly configService: IConfigService;

	constructor(configService: IConfigService) {
		this.configService = configService;
	}

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
			return [null, new Error("No active editor or document is closed")];
		}

		const editPromise = Promise.resolve(
			this.currentEditor.edit((editBuilder) => {
				editBuilder.insert(new vscode.Position(0, 0), license + "\n\n");
			})
		);

		const savePromise = Promise.resolve(this.currentDocument.save());

		const [edit, editError] = await tryCatch(editPromise);

		if (editError) {
			return [null, editError];
		}

		if (edit === false) {
			return [null, new Error("Failed to edit document")];
		}

		const [saved, saveError] = await tryCatch(savePromise);

		if (saveError) {
			return [null, saveError];
		}

		if (!saved) {
			return [null, new Error(ERROR_MESSAGES.FAILED_TO_SAVE_DOCUMENT)];
		}

		return [saved, null];
	}

	public async hasTypo(): Promise<Result<boolean, Error>> {
		const contentPromise = Promise.resolve(this.currentDocument?.getText());
		const [content, contentError] = await tryCatch(contentPromise);
		const [hasLicense, hasLicenseError] = await this.hasLicense();

		switch (true) {
			case hasLicenseError !== null:
				return [null, hasLicenseError];
			case hasLicense === false:
				return [false, null];
			case !content:
				return [
					null,
					contentError || new Error("Content is undefined"),
				];
		}

		const extractedLicense = this.extractLicense(content);
		const defaultLicense = this.configService.defaultLicense;
		const defaultLicenseContent = defaultLicense.content;
		const hasTypo =
			extractedLicense.trim() !== defaultLicenseContent.trim();

		return [hasTypo, null];
	}

	public async hasLicense(): Promise<Result<boolean, Error>> {
		const contentPromise = Promise.resolve(this.currentDocument?.getText());
		const [content, contentError] = await tryCatch(contentPromise);

		if (contentError || content === undefined) {
			return [null, contentError || new Error("Content is undefined")];
		}

		const licenseRegex = new RegExp(licensePhrases.join("|"), "i");
		const hasLicense = licenseRegex.test(content);

		return [hasLicense, null];
	}

	public extractLicense(content: string): string {
		let i = 0;
		const len = content.length;
		let licenseBlock = "";

		while (i < len) {
			if (content[i] === "/" && content[i + 1] === "*") {
				let end = i + 2;
				while (
					end < len &&
					!(content[end] === "*" && content[end + 1] === "/")
				) {
					end++;
				}
				if (end < len) {
					licenseBlock = content.slice(i, end + 2);
					break;
				}
			}
			i++;
		}

		return licenseBlock;
	}
}
