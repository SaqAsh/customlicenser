import * as vscode from "vscode";
import { getLicenseOptions, LicenseOption } from "./selectLicenseToAdd";

/**
 * Shows license selection dialog for setting workspace default.
 *
 * Allows user to select a default license type for auto-insertion.
 * Saves selection to workspace configuration.
 *
 * @returns Promise resolving to true if default was set, false if cancelled
 */
export const selectDefaultLicense = async (): Promise<boolean> => {
	try {
		const options = getLicenseOptions();

		const selected = await vscode.window.showQuickPick(options, {
			placeHolder: "Select a default license for this workspace",
			matchOnDescription: true,
			ignoreFocusOut: true,
		});

		if (!selected) {
			return false; // User cancelled
		}

		// Save to workspace configuration
		const config = vscode.workspace.getConfiguration("customlicenser");
		await config.update(
			"defaultLicense",
			selected.type,
			vscode.ConfigurationTarget.Workspace
		);

		vscode.window.showInformationMessage(
			`Default license set to: ${selected.label}`
		);
		return true;
	} catch (error) {
		vscode.window.showErrorMessage(
			`Failed to set default license: ${error}`
		);
		return false;
	}
};

/**
 * Gets the currently set default license type.
 *
 * @returns The default license type string or undefined if not set
 */
export const getDefaultLicense = (): string | undefined => {
	const config = vscode.workspace.getConfiguration("customlicenser");
	return config.get<string>("defaultLicense");
};
