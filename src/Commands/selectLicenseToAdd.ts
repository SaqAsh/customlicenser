import * as vscode from "vscode";
import { displayQuickPick } from "../utils/quickPick";

export type LicenseType =
	| "MIT"
	| "Apache"
	| "GPL"
	| "BSD"
	| "ISC"
	| "Mozilla"
	| "Custom"
	| "SavedCustom";

export type LicenseOption = {
	label: string;
	description: string;
	type: LicenseType;
	filename?: string;
	customId?: string; // For saved custom licenses
	customContent?: string; // For saved custom licenses
};

export interface CustomLicense {
	name: string;
	content: string;
	id: string;
}

/**
 * Gets the list of available license options for selection, including saved custom licenses.
 * @returns Array of license options with labels, descriptions, and metadata
 */
export const getLicenseOptions = (): LicenseOption[] => {
	// Get saved custom licenses from configuration
	const config = vscode.workspace.getConfiguration("customlicenser");
	const customLicenses = config.get<CustomLicense[]>("customLicenses") || [];

	const standardLicenses: LicenseOption[] = [
		{
			label: "MIT License",
			description: "A short and simple permissive license",
			type: "MIT",
			filename: "MIT.txt",
		},
		{
			label: "Apache License 2.0",
			description: "A permissive license with patent protection",
			type: "Apache",
			filename: "Apache.txt",
		},
		{
			label: "GNU General Public License v3.0",
			description: "Strong copyleft license",
			type: "GPL",
			filename: "GPL.txt",
		},
		{
			label: "BSD 3-Clause License",
			description: "A permissive license similar to MIT",
			type: "BSD",
			filename: "BSD.txt",
		},
		{
			label: "ISC License",
			description: "A simplified version of the MIT license",
			type: "ISC",
			filename: "ISC.txt",
		},
		{
			label: "Mozilla Public License 2.0",
			description: "Weak copyleft license",
			type: "Mozilla",
			filename: "Mozilla.txt",
		},
	];

	// Convert saved custom licenses to license options
	const savedCustomLicenseOptions: LicenseOption[] = customLicenses.map(
		(license) => ({
			label: `📄 ${license.name}`,
			description: `Custom: ${license.content.substring(0, 80)}${
				license.content.length > 80 ? "..." : ""
			}`,
			type: "SavedCustom",
			customId: license.id,
			customContent: license.content,
		})
	);

	// Add separator and "Create New Custom License" option
	const customLicenseOptions: LicenseOption[] = [];

	if (savedCustomLicenseOptions.length > 0) {
		customLicenseOptions.push(...savedCustomLicenseOptions);
		customLicenseOptions.push({
			label: "────────────────────",
			description: "",
			type: "Custom", // Separator, provides visual separation
		});
	}

	customLicenseOptions.push({
		label: "➕ Create New Custom License",
		description: "Add your own custom license text",
		type: "Custom",
	});

	return [...standardLicenses, ...customLicenseOptions];
};

/**
 * Shows a quick pick dialog for license selection.
 * Displays all available licenses (standard and custom) for user selection.
 * @returns Promise resolving to selected license option or undefined if cancelled
 */
export const selectLicenseToAdd = async (): Promise<
	LicenseOption | undefined
> => {
	return await displayQuickPick(
		getLicenseOptions(),
		"Select a license to add to your file",
		true,
		true
	);
};
