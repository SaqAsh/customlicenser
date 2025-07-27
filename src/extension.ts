import * as vscode from "vscode";
import { getYear } from "./Commands/addYear";
import { toggleAutoAddOnSave } from "./Commands/toggleAutoAddOnSave";
import { selectLicenseToAdd } from "./Commands/selectLicenseToAdd";
import { addCustomLicense } from "./Commands/addCustomLicense";
import { selectDefaultLicense } from "./Commands/selectDefaultLicense";
import {
	editCustomLicense,
	createNewCustomLicense,
} from "./Commands/editCustomLicense";
import {
	startLicenseDetection,
	stopLicenseDetection,
	getLicenseDetector,
} from "./BackgroundUtilities/licenseDetector";
import {
	enableAutoAddOnSave,
	disableAutoAddOnSave,
	isAutoAddOnSaveEnabled,
} from "./BackgroundUtilities/autoAddOnSave";
import { determineCommentType } from "./BackgroundUtilities/commentTypeManger";
import {
	readLicenseTemplate,
	processLicenseTemplate,
} from "./BackgroundUtilities/licenseReader";
import {
	insertLicenseIntoCurrentFile,
	checkIfLicenseExists,
} from "./BackgroundUtilities/licenseInserter";
import { getLicenseOptions } from "./Commands/selectLicenseToAdd";

// Main function to add any license to current file
const addLicenseToFile = async (licenseType?: string): Promise<void> => {
	try {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage("No active file to add license to");
			return;
		}

		// Check if license already exists
		if (checkIfLicenseExists(editor.document)) {
			const overwrite = await vscode.window.showWarningMessage(
				"A license may already exist in this file. Do you want to add another one?",
				"Yes",
				"No"
			);
			if (overwrite !== "Yes") {
				return;
			}
		}

		// Get license option
		let licenseOption;
		if (licenseType) {
			const options = getLicenseOptions();
			licenseOption = options.find((opt) => opt.type === licenseType);
		} else {
			licenseOption = await selectLicenseToAdd();
		}

		if (!licenseOption) {
			return;
		}

		// Get comment type
		const commentType = await determineCommentType();
		if (!commentType) {
			vscode.window.showErrorMessage(
				"Unable to determine comment type for this file"
			);
			return;
		}

		// Read and process license
		const licenseTemplate = await readLicenseTemplate(licenseOption);
		if (!licenseTemplate) {
			vscode.window.showErrorMessage("Failed to read license template");
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

		let formattedLicense: string;
		if (commentType.type === "line") {
			const lines = processedTemplate.split("\n");
			formattedLicense = lines
				.map((line) => `${commentType.prefix}${line}`)
				.join("\n");
		} else {
			// commentType.type === "block" - format with proper line-by-line structure
			const lines = processedTemplate.split("\n");
			const formattedLines = [
				commentType.start,
				...lines.map((line) => ` * ${line}`),
				` ${commentType.end}`,
			];
			formattedLicense = formattedLines.join("\n");
		}

		await insertLicenseIntoCurrentFile(formattedLicense);
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to add license: ${error}`);
	}
};

/**
 * Activates the CustomLicenser extension.
 *
 * Initializes background services including license detection and auto-add functionality.
 * Registers all VS Code commands for license management operations.
 *
 * @param context - The VS Code extension context for managing subscriptions and lifecycle
 */
export function activate(context: vscode.ExtensionContext) {
	// Start background services
	startLicenseDetection();

	// Enable auto-add on save if configured
	if (isAutoAddOnSaveEnabled()) {
		enableAutoAddOnSave();
	}

	const commands = [
		{
			command: "customlicenser.toggleAutoSave",
			callback: async () => {
				const isEnabled = await toggleAutoAddOnSave();
				const config: vscode.WorkspaceConfiguration =
					vscode.workspace.getConfiguration("customlicenser");

				if (isEnabled === undefined) {
					vscode.window.showErrorMessage(
						"Unable to set default toggle on save"
					);
					await config.update(
						"toggleOnSave",
						false,
						vscode.ConfigurationTarget.Workspace
					);
					disableAutoAddOnSave();
				} else if (isEnabled === true) {
					vscode.window.showInformationMessage(
						"Successfully enabled autoSave "
					);
					await config.update(
						"toggleOnSave",
						true,
						vscode.ConfigurationTarget.Workspace
					);
					enableAutoAddOnSave();
				} else {
					vscode.window.showInformationMessage(
						"Successfully disabled autoSave "
					);
					await config.update(
						"toggleOnSave",
						false,
						vscode.ConfigurationTarget.Workspace
					);
					disableAutoAddOnSave();
				}
			},
		},
		{
			command: "customlicenser.addYear",
			callback: async () => {
				const year = await getYear();
				if (year !== undefined) {
					vscode.window.showInformationMessage(
						`Year has been saved to: ${year}`
					);
				} else {
					vscode.window.showErrorMessage(
						"Enable to save year, please try again "
					);
				}
			},
		},
		{
			command: "customlicenser.addName",
			callback: async () => {
				const name = await vscode.window.showInputBox({
					prompt: "Enter your name for license headers",
					placeHolder: "Your Name",
					ignoreFocusOut: true,
				});

				if (name) {
					const config =
						vscode.workspace.getConfiguration("customlicenser");
					await config.update(
						"authorName",
						name,
						vscode.ConfigurationTarget.Workspace
					);
					vscode.window.showInformationMessage(
						`Author name set to: ${name}`
					);
				}
			},
		},
		{
			command: "customlicenser.selectLicense",
			callback: () => addLicenseToFile(),
		},
		{
			command: "customlicenser.addMITLicense",
			callback: () => addLicenseToFile("MIT"),
		},
		{
			command: "customlicenser.addGPLLicense",
			callback: () => addLicenseToFile("GPL"),
		},
		{
			command: "customlicenser.addApacheLicense",
			callback: () => addLicenseToFile("Apache"),
		},
		{
			command: "customlicenser.addBSDLicense",
			callback: () => addLicenseToFile("BSD"),
		},
		{
			command: "customlicenser.addISCLicense",
			callback: () => addLicenseToFile("ISC"),
		},
		{
			command: "customlicenser.addMozillaLicense",
			callback: () => addLicenseToFile("Mozilla"),
		},
		{
			command: "customlicenser.addCustomLicense",
			callback: async () => {
				const success = await addCustomLicense();
				if (!success) {
					vscode.window.showErrorMessage(
						"Failed to add custom license"
					);
				}
			},
		},
		{
			command: "customlicenser.manageCustomLicenses",
			callback: async () => {
				const success = await editCustomLicense();
				if (!success) {
					vscode.window.showInformationMessage(
						"No changes made to custom licenses"
					);
				}
			},
		},
		{
			command: "customlicenser.createCustomLicense",
			callback: async () => {
				const success = await createNewCustomLicense();
				if (!success) {
					vscode.window.showErrorMessage(
						"Failed to create custom license"
					);
				}
			},
		},
		{
			command: "customlicenser.selectDefaultLicense",
			callback: async () => {
				const success = await selectDefaultLicense();
				if (!success) {
					vscode.window.showInformationMessage(
						"No default license selected"
					);
				}
			},
		},
		{
			command: "customlicenser.checkLicenseCoverage",
			callback: () => {
				const detector = getLicenseDetector();
				if (!detector) {
					vscode.window.showErrorMessage(
						"License detection not running"
					);
					return;
				}

				const statuses = detector.getLicenseStatuses();
				const filesWithoutLicense = detector.getFilesWithoutLicense();

				if (statuses.length === 0) {
					vscode.window.showInformationMessage(
						"No code files detected in workspace"
					);
					return;
				}

				const totalFiles = statuses.length;
				const filesWithLicense =
					totalFiles - filesWithoutLicense.length;
				const percentage = Math.round(
					(filesWithLicense / totalFiles) * 100
				);

				const message =
					`License Coverage Report:\n` +
					`Files with licenses: ${filesWithLicense}/${totalFiles} (${percentage}%)\n` +
					`Files without licenses: ${filesWithoutLicense.length}`;

				if (filesWithoutLicense.length > 0) {
					const fileList = filesWithoutLicense
						.slice(0, 10) // Show first 10 files
						.map((status) => status.filePath.split("/").pop())
						.join(", ");

					const fullMessage =
						message +
						`\n\nFiles without licenses: ${fileList}` +
						(filesWithoutLicense.length > 10
							? ` and ${filesWithoutLicense.length - 10} more...`
							: "");

					vscode.window.showWarningMessage(fullMessage);
				} else {
					vscode.window.showInformationMessage(
						message + "\n\nAll files have licenses! 🎉"
					);
				}
			},
		},
		{
			command: "customlicenser.configureSettings",
			callback: () => {
				vscode.commands.executeCommand(
					"workbench.action.openSettings",
					"customlicenser"
				);
			},
		},
	];

	commands.forEach(({ command, callback }) => {
		const disposable = vscode.commands.registerCommand(command, callback);
		context.subscriptions.push(disposable);
	});
}

/**
 * Deactivates the CustomLicenser extension.
 *
 * Cleans up background services and stops license detection to prevent memory leaks.
 */
export function deactivate() {
	stopLicenseDetection();
	disableAutoAddOnSave();
}
