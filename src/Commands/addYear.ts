import * as vscode from "vscode";

/**
 * Prompts user for year input and saves to workspace configuration.
 *
 * Used for license template variable substitution.
 *
 * @returns Promise resolving to the entered year string or undefined if cancelled
 */
export const getYear = async (): Promise<string | undefined> => {
	const year: string | undefined = await vscode.window.showInputBox({
		prompt: "Enter the year for the license",
		placeHolder: `${new Date()}`,
		value: new Date().getFullYear().toString(),
		validateInput: (value) => {
			return !value || isNaN(Number(value))
				? "Please enter a valid year"
				: null;
		},
	});

	if (year !== undefined) {
		const config: vscode.WorkspaceConfiguration =
			vscode.workspace.getConfiguration("customlicenser");
		await config.update(
			"defaultYear",
			year,
			vscode.ConfigurationTarget.Workspace
		);
	}

	return year;
};
