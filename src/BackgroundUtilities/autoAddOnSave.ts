import * as vscode from "vscode";
import { getDefaultLicense } from "../Commands/selectDefaultLicense.ts";
import { checkIfLicenseExists } from "../utils/check-if-license-exists.ts";
import { getLicenseOptions } from "../utils/getLicenseOptions.ts";
import {
	blockFormatLicense,
	lineFormatLicense,
} from "../utils/licenseFormatters.ts";
import { determineCommentType } from "./commentTypeManger.ts";
import { fileTypeManger } from "./fileTypeManager.ts";
import {
	processLicenseTemplate,
	readLicenseTemplate,
} from "./licenseReader.ts";

export class AutoAddOnSave {
	private disposable: vscode.Disposable | undefined;

	public enable(): void {
		if (this.disposable) {
			return;
		}

		this.disposable = vscode.workspace.onWillSaveTextDocument(
			async (event) => {
				const config =
					vscode.workspace.getConfiguration("customlicenser");
				const isEnabled = config.get<boolean>("toggleOnSave", false);

				if (!isEnabled) {
					return;
				}

				const document = event.document;

				// Skip if file already has a license
				if (await checkIfLicenseExists(document)) {
					return;
				}

				// Skip non-code files
				if (this.shouldSkipFile(document.uri.fsPath)) {
					return;
				}

				// Get default license
				const defaultLicenseType = getDefaultLicense();
				if (!defaultLicenseType) {
					// No default license set, skip
					return;
				}

				try {
					await this.addDefaultLicenseToDocument(
						document,
						defaultLicenseType
					);
				} catch (error) {
					// Silently fail to avoid disrupting save process
					console.error("Failed to auto-add license:", error);
				}
			}
		);
	}

	public disable(): void {
		if (this.disposable) {
			this.disposable.dispose();
			this.disposable = undefined;
		}
	}

	private async addDefaultLicenseToDocument(
		document: vscode.TextDocument,
		licenseType: string
	): Promise<void> {
		// Find the license option
		const licenseOptions = getLicenseOptions();
		const licenseOption = licenseOptions.find(
			(option) => option.type === licenseType
		);

		if (!licenseOption) {
			return;
		}

		// Get comment type for the file
		const commentType = await determineCommentType();
		if (!commentType) {
			return;
		}

		// Read and process license template
		const licenseTemplate = await readLicenseTemplate(licenseOption);
		if (!licenseTemplate) {
			return;
		}

		const config = vscode.workspace.getConfiguration("customlicenser");
		const userName = config.get<string>("authorName") || "Your Name";
		const userEmail =
			config.get<string>("authorEmail") || "your.email@example.com";

		const processedTemplate = processLicenseTemplate(licenseTemplate, {
			name: userName,
			email: userEmail,
		});

		const languageId = fileTypeManger()?.languageID.toLowerCase() ?? "c";

		const formattedLicense =
			commentType.type === "line"
				? lineFormatLicense(processedTemplate, languageId)
				: blockFormatLicense(processedTemplate, languageId);

		const edit = new vscode.WorkspaceEdit();
		const insertPosition = new vscode.Position(0, 0);
		const licenseWithBreaks = formattedLicense + "\n\n";

		edit.insert(document.uri, insertPosition, licenseWithBreaks);
		await vscode.workspace.applyEdit(edit);
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
			".log",
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
			"tmp",
			"temp",
		];

		// Check file extension
		const extension = filePath.substring(filePath.lastIndexOf("."));
		if (skipExtensions.includes(extension.toLowerCase())) {
			return true;
		}

		// Check if file is in skip directories
		return skipDirectories.some(
			(dir) =>
				filePath.includes(`/${dir}/`) ||
				filePath.includes(`\\${dir}\\`) ||
				filePath.endsWith(`/${dir}`) ||
				filePath.endsWith(`\\${dir}`)
		);
	}
}

// Global instance
let autoAddOnSave: AutoAddOnSave | undefined;

/**
 * Enables automatic license insertion on file save.
 *
 * Sets up file save event listeners to automatically add default licenses
 * to files that don't already have them.
 */
export const enableAutoAddOnSave = (): void => {
	if (!autoAddOnSave) {
		autoAddOnSave = new AutoAddOnSave();
	}
	autoAddOnSave.enable();
};

/**
 * Disables automatic license insertion on file save.
 * Removes file save event listeners and cleans up auto-add functionality.
 */
export const disableAutoAddOnSave = (): void => {
	if (autoAddOnSave) {
		autoAddOnSave.disable();
	}
};

/**
 * Checks if auto-add on save is currently enabled.
 *
 * @returns True if auto-add is enabled, false otherwise
 */
export const isAutoAddOnSaveEnabled = (): boolean => {
	const config = vscode.workspace.getConfiguration("customlicenser");
	return config.get<boolean>("toggleOnSave", false);
};
