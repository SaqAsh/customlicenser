import * as vscode from "vscode";
import { checkIfLicenseExists } from "../utils/check-if-license-exists.js";

export interface LicenseStatus {
    hasLicense: boolean;
    filePath: string;
    lastChecked: Date;
}

export class LicenseDetector {
    private statusBarItem: vscode.StatusBarItem;
    private fileWatcher: vscode.FileSystemWatcher | undefined;
    private licenseStatuses: Map<string, LicenseStatus> = new Map();

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = "customlicenser.checkLicenseCoverage";
        this.updateStatusBar();
        this.statusBarItem.show();
    }

    public startWatching(): void {
        // Watch for file changes
        this.fileWatcher = vscode.workspace.createFileSystemWatcher("**/*");

        this.fileWatcher.onDidChange((uri) => this.checkFileForLicense(uri));
        this.fileWatcher.onDidCreate((uri) => this.checkFileForLicense(uri));
        this.fileWatcher.onDidDelete((uri) => this.removeFileFromStatus(uri));

        // Check currently open files
        vscode.workspace.textDocuments.forEach((doc) => {
            if (!doc.isUntitled) {
                this.checkFileForLicense(doc.uri);
            }
        });

        // Check active editor changes
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor && !editor.document.isUntitled) {
                this.checkFileForLicense(editor.document.uri);
            }
        });

        // Periodic check every 30 seconds
        setInterval(() => {
            this.checkAllOpenFiles();
        }, 30000);
    }

    public stopWatching(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = undefined;
        }
        this.statusBarItem.dispose();
    }

    private async checkFileForLicense(uri: vscode.Uri): Promise<void> {
        try {
            // Skip non-code files
            if (this.shouldSkipFile(uri.fsPath)) {
                return;
            }

            const document = await vscode.workspace.openTextDocument(uri);
            const hasLicense = checkIfLicenseExists(document);

            const status: LicenseStatus = {
                hasLicense: hasLicense?.containsKeyword ?? false,
                filePath: uri.fsPath,
                lastChecked: new Date(),
            };

            this.licenseStatuses.set(uri.fsPath, status);
            this.updateStatusBar();
        } catch (error) {}
    }

    private removeFileFromStatus(uri: vscode.Uri): void {
        this.licenseStatuses.delete(uri.fsPath);
        this.updateStatusBar();
    }

    private shouldSkipFile(filePath: string): boolean {
        const skipExtensions = [
            ".json",
            ".md",
            ".txt",
            ".xml",
            ".yml",
            ".yaml",
            ".png",
            ".jpg",
            ".jpeg",
            ".gif",
            ".svg",
            ".ico",
            ".pdf",
            ".zip",
            ".tar",
            ".gz",
        ];

        const skipDirectories = [
            "node_modules",
            ".git",
            "dist",
            "build",
            "out",
            ".vscode",
            ".idea",
            "coverage",
        ];

        // Check file extension
        const extension = filePath.substring(filePath.lastIndexOf("."));
        if (skipExtensions.includes(extension.toLowerCase())) {
            return true;
        }

        // Check if file is in skip directories
        return skipDirectories.some(
            (dir) =>
                filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`)
        );
    }

    private checkAllOpenFiles(): void {
        vscode.workspace.textDocuments.forEach((doc) => {
            if (!doc.isUntitled && !this.shouldSkipFile(doc.uri.fsPath)) {
                this.checkFileForLicense(doc.uri);
            }
        });
    }

    private updateStatusBar(): void {
        const totalFiles = this.licenseStatuses.size;
        const filesWithLicense = Array.from(
            this.licenseStatuses.values()
        ).filter((status) => status.hasLicense).length;

        if (totalFiles === 0) {
            this.statusBarItem.text = "$(file-code) License: No files";
            this.statusBarItem.tooltip = "No code files detected";
        } else {
            const percentage = Math.round(
                (filesWithLicense / totalFiles) * 100
            );
            this.statusBarItem.text = `$(file-code) License: ${filesWithLicense}/${totalFiles} (${percentage}%)`;
            this.statusBarItem.tooltip = `License coverage: ${filesWithLicense} out of ${totalFiles} files have licenses`;
        }
    }

    public getLicenseStatuses(): LicenseStatus[] {
        return Array.from(this.licenseStatuses.values());
    }

    public getFilesWithoutLicense(): LicenseStatus[] {
        return Array.from(this.licenseStatuses.values()).filter(
            (status) => !status.hasLicense
        );
    }
}

// Global instance
let licenseDetector: LicenseDetector | undefined;

/**
 * Starts the background license detection service.
 *
 * Initializes file watching, status bar updates, and periodic license scanning.
 * Should be called during extension activation.
 */
export const startLicenseDetection = (): void => {
    if (!licenseDetector) {
        licenseDetector = new LicenseDetector();
        licenseDetector.startWatching();
    }
};

/**
 * Stops the background license detection service.
 *
 * Cleans up file watchers and status bar items to prevent memory leaks.
 * Should be called during extension deactivation.
 */
export const stopLicenseDetection = (): void => {
    if (licenseDetector) {
        licenseDetector.stopWatching();
        licenseDetector = undefined;
    }
};

/**
 * Gets the current license detector instance.
 *
 * @returns The active license detector instance or undefined if not initialized
 */
export const getLicenseDetector = (): LicenseDetector | undefined => {
    return licenseDetector;
};
