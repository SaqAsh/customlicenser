import * as vscode from "vscode";

import { skipExtensions } from "../constants/SkipExtensions";
import { CommentLookup } from "../types/CommentLookup";
import { CommentStyle } from "../types/CommentStyle";
import { FileInfo } from "../types/FileInfo";
import { IFileService } from "./interfaces/IFileService";

export class FileService implements IFileService {
    private readonly editor = vscode.window.activeTextEditor;
    private readonly document = this.editor?.document;
    private readonly license: string;

    constructor(license: string) {
        this.license = license;
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
                    this.license + "\n\n"
                );
            });

            if (!edit) {
                return false;
            }

            await this.document.save();
            return true;
        } catch (err) {
            console.error("Error inserting license:", err);
            return false;
        }
    }
}
