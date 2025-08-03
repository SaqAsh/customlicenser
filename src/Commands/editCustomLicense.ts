import * as vscode from "vscode";
import error from "../utils/loggers/error";
import info from "../utils/loggers/info";
import { displayQuickPick } from "../utils/quickPick";
import { updatePreference } from "../utils/updatePreference";
import warn from "../utils/loggers/warn";

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
			const create = await info(
				"No custom licenses found. Would you like to create one?",
				[{ title: "Yes" }, { title: "No" }]
			);
			if (create?.title === "Yes") {
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

		const selected = await displayQuickPick(
			licenseOptions,
			"Select a custom license to edit",
			false,
			true
		);

		if (!selected) {
			return false; // User cancelled
		}

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

		await updatePreference(updatedLicenses, "customLicenses");
		info(`Custom license "${selected.license.name}" updated successfully!`);
		return true;
	} catch (err) {
		error(`Failed to edit custom license: ${err}`);
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

		if (name === undefined) {
			warn("License creation cancelled.");
			return false;
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

		if (content === undefined) {
			warn("License creation cancelled.");
			return false;
		}

		const newLicense: CustomLicense = {
			name: name.trim(),
			content: content.trim(),
			id: Date.now().toString(),
		};

		// Add to existing custom licenses
		const config = vscode.workspace.getConfiguration("customlicenser");
		const existingLicenses =
			config.get<CustomLicense[]>("customLicenses") || [];

		const updatedLicenses = [...existingLicenses, newLicense];

		await updatePreference(updatedLicenses, "customLicenses");
		info(`Custom license "${name}" created successfully!`);
		return true;
	} catch (err) {
		error(`Failed to create custom license: ${err}`);
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
