import * as vscode from "vscode";

export interface CustomLicense {
	name: string;
	content: string;
	id: string;
}

/**
 * Manages existing custom licenses in workspace configuration.
 *
 * Shows list of saved custom licenses and allows editing their content.
 * Creates new custom license if none exist.
 *
 * @returns Promise resolving to true if changes were made, false otherwise
 */
export const editCustomLicense = async (): Promise<boolean> => {
	try {
		const config = vscode.workspace.getConfiguration("customlicenser");
		const customLicenses =
			config.get<CustomLicense[]>("customLicenses") || [];

		if (customLicenses.length === 0) {
			const create = await vscode.window.showInformationMessage(
				"No custom licenses found. Would you like to create one?",
				"Yes",
				"No"
			);
			if (create === "Yes") {
				return await createNewCustomLicense();
			}
			return false;
		}

		// Show list of existing custom licenses
		const licenseOptions = customLicenses.map((license) => ({
			label: license.name,
			description: license.content.substring(0, 100) + "...",
			license: license,
		}));

		const selected = await vscode.window.showQuickPick(licenseOptions, {
			placeHolder: "Select a custom license to edit",
			ignoreFocusOut: true,
		});

		if (!selected) {
			return false; // User cancelled
		}

		// Edit the selected license
		const newContent = await vscode.window.showInputBox({
			prompt: `Edit custom license: ${selected.license.name}`,
			value: selected.license.content,
			ignoreFocusOut: true,
			validateInput: (value) => {
				if (!value || value.trim().length === 0) {
					return "License content cannot be empty";
				}
				return null;
			},
		});

		if (!newContent) {
			return false; // User cancelled
		}

		// Update the license in the array
		const updatedLicenses = customLicenses.map((license) =>
			license.id === selected.license.id
				? { ...license, content: newContent.trim() }
				: license
		);

		// Save back to configuration
		await config.update(
			"customLicenses",
			updatedLicenses,
			vscode.ConfigurationTarget.Workspace
		);

		vscode.window.showInformationMessage(
			`Custom license "${selected.license.name}" updated successfully!`
		);
		return true;
	} catch (error) {
		vscode.window.showErrorMessage(
			`Failed to edit custom license: ${error}`
		);
		return false;
	}
};

/**
 * Creates a new custom license template.
 *
 * Prompts user for license name and content, then saves to workspace configuration.
 *
 * @returns Promise resolving to true if created successfully, false otherwise
 */
export const createNewCustomLicense = async (): Promise<boolean> => {
	try {
		// Get license name
		const name = await vscode.window.showInputBox({
			prompt: "Enter a name for your custom license",
			placeHolder: "My Custom License",
			ignoreFocusOut: true,
			validateInput: (value) => {
				if (!value || value.trim().length === 0) {
					return "License name cannot be empty";
				}
				return null;
			},
		});

		if (!name) {
			return false; // User cancelled
		}

		// Get license content
		const content = await vscode.window.showInputBox({
			prompt: "Enter the license content",
			placeHolder: "Copyright (c) 2024 Your Name. All rights reserved.",
			ignoreFocusOut: true,
			validateInput: (value) => {
				if (!value || value.trim().length === 0) {
					return "License content cannot be empty";
				}
				return null;
			},
		});

		if (!content) {
			return false; // User cancelled
		}

		// Create new custom license
		const newLicense: CustomLicense = {
			name: name.trim(),
			content: content.trim(),
			id: Date.now().toString(), // Simple ID generation
		};

		// Add to existing custom licenses
		const config = vscode.workspace.getConfiguration("customlicenser");
		const existingLicenses =
			config.get<CustomLicense[]>("customLicenses") || [];
		const updatedLicenses = [...existingLicenses, newLicense];

		await config.update(
			"customLicenses",
			updatedLicenses,
			vscode.ConfigurationTarget.Workspace
		);

		vscode.window.showInformationMessage(
			`Custom license "${name}" created successfully!`
		);
		return true;
	} catch (error) {
		vscode.window.showErrorMessage(
			`Failed to create custom license: ${error}`
		);
		return false;
	}
};

/**
 * Retrieves all custom licenses from workspace configuration.
 *
 * @returns Array of custom license objects with id, name, and content
 */
export const getCustomLicenses = (): CustomLicense[] => {
	const config = vscode.workspace.getConfiguration("customlicenser");
	return config.get<CustomLicense[]>("customLicenses") || [];
};
