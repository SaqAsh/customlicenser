import * as vscode from "vscode";
import { WorkspaceConfiguration } from "vscode";

const getYearFromUser = async () => {
	return vscode.window.showInputBox({
		prompt: "Enter the year for the license",
		placeHolder: `${new Date()}`,
		value: new Date().getFullYear().toString(),
		validateInput: (value) => {
			return !value || isNaN(Number(value))
				? "Please enter a valid year"
				: null;
		},
	});
};

const handleYear = async (year: string, config: WorkspaceConfiguration) => {
	return config.update(
		"defaultYear",
		year,
		vscode.ConfigurationTarget.Workspace
	);
};

/**
 * Prompts user for year input and saves to workspace configuration.
 * Used for license template variable substitution.
 * @returns Promise resolving to the entered year string or undefined if cancelled
 */
export const getYear = async (): Promise<string | undefined> => {
	const year: string | undefined = await getYearFromUser();

	if (year !== undefined) {
		await handleYear(
			year,
			vscode.workspace.getConfiguration("customlicenser")
		);
	}

	return year;
};
