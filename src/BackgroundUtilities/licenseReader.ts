import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";
import { LicenseOption } from "../Commands/selectLicenseToAdd";

/**
 * Reads and loads a license template from file or user input.
 *
 * For standard licenses, reads from template files. For custom licenses,
 * prompts user for input. Handles multiple file path resolution strategies
 * for development and production environments.
 *
 * @param licenseOption - The license option containing type and filename information
 * @returns Promise resolving to license template content or undefined if not found
 */
export const readLicenseTemplate = async (
	licenseOption: LicenseOption
): Promise<string | undefined> => {
	try {
		if (licenseOption.type === "SavedCustom") {
			// For saved custom licenses, return the stored content directly
			return licenseOption.customContent;
		}

		if (licenseOption.type === "Custom") {
			// For custom licenses, prompt user for input
			const customText = await vscode.window.showInputBox({
				prompt: "Enter your custom license text",
				placeHolder: "Copyright (c) 2024 Your Name...",
				ignoreFocusOut: true,
				validateInput: (value) => {
					if (!value || value.trim().length === 0) {
						return "License text cannot be empty";
					}
					return null;
				},
			});
			return customText?.trim();
		}

		if (!licenseOption.filename) {
			return undefined;
		}

		// Try multiple paths to find the license templates
		const workspaceRoot =
			vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		const possiblePaths = [
			// Path from workspace root (most reliable in development)
			...(workspaceRoot
				? [
						path.join(
							workspaceRoot,
							"src",
							"LicenseTemplates",
							licenseOption.filename
						),
				  ]
				: []),
			// Path when running in development (from dist/ directory)
			path.join(
				__dirname,
				"..",
				"src",
				"LicenseTemplates",
				licenseOption.filename
			),
			// Path when running from out/ directory
			path.join(
				__dirname,
				"..",
				"..",
				"src",
				"LicenseTemplates",
				licenseOption.filename
			),
			// Path relative to current file
			path.join(
				__dirname,
				"..",
				"LicenseTemplates",
				licenseOption.filename
			),
		];

		// Add extension path if available
		const extension =
			vscode.extensions.getExtension("customlicenser") ||
			vscode.extensions.getExtension("publisher.customlicenser");
		if (extension) {
			possiblePaths.unshift(
				path.join(
					extension.extensionPath,
					"src",
					"LicenseTemplates",
					licenseOption.filename
				)
			);
		}

		// Try each path until we find the file
		for (const templatePath of possiblePaths) {
			try {
				const content = await fs.readFile(templatePath, "utf-8");
				console.log(`Found license template at: ${templatePath}`);
				return content;
			} catch (error) {
				// Continue to next path
				console.log(`Template not found at: ${templatePath}`);
			}
		}

		// If none of the paths worked, show an error with debug info
		vscode.window.showErrorMessage(
			`Failed to find license template: ${
				licenseOption.filename
			}. Tried paths: ${possiblePaths.join(", ")}`
		);
		return undefined;
	} catch (error) {
		vscode.window.showErrorMessage(
			`Failed to read license template: ${error}`
		);
		return undefined;
	}
};

/**
 * Processes a license template by substituting variables with actual values.
 *
 * Replaces template variables like `{{year}}`, `{{name}}`, `{{email}}` with
 * current values from configuration or system.
 *
 * @param template - The raw license template string
 * @param variables - Optional object containing variable overrides
 * @returns Processed license template with variables substituted
 */
export const processLicenseTemplate = (
	template: string,
	variables: { [key: string]: string } = {}
): string => {
	let processed = template;

	// Replace common variables
	const currentYear = new Date().getFullYear().toString();
	const defaultVariables = {
		year: currentYear,
		name: "Your Name",
		email: "your.email@example.com",
		...variables,
	};

	// Replace variables in the format {{variable}}
	Object.entries(defaultVariables).forEach(([key, value]) => {
		const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
		processed = processed.replace(regex, value);
	});

	return processed;
};
