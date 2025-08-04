import * as vscode from "vscode";

import { licensePhrases, skipExtensions } from "../constants";
import { CommentLookup, CommentStyle, FileInfo } from "../types";
import { error } from "../loggers";
import { IFileService } from "./interfaces";

export class FileService implements IFileService {
    private readonly editor = vscode.window.activeTextEditor;
    private readonly document = this.editor?.document;
    private readonly currentFilePath = this.document?.uri.fsPath;
    private fuse: any = null;

    constructor() {
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
            filePath: this.currentFilePath,
            uri: this.document?.uri,
        };
    }

    public get commentStyle(): CommentStyle {
        return this.language in CommentLookup
            ? CommentLookup[this.language as keyof typeof CommentLookup]
            : { type: "line" };
    }

    public shouldProcessFile(): boolean {
        const ext = this.currentFilePath?.split(".").pop();
        return ext ? !skipExtensions.has(ext) : true;
    }

    public async insertIntoFile(license: string): Promise<boolean> {
        try {
            if (!this.editor || !this.document) {
                return false;
            }

            const edit = await this.editor.edit((editBuilder) => {
                editBuilder.insert(new vscode.Position(0, 0), license + "\n");
            });

            if (edit === false) {
                return false;
            }

            const saved = await this.document.save();

            if (!saved) {
                error("Failed to save document after inserting license");
                return false;
            }

            return saved;
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
