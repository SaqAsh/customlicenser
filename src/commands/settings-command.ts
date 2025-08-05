import * as vscode from "vscode";

export function configureSettingsCommand(): void {
	vscode.commands.executeCommand(
		"workbench.action.openSettings",
		"customlicenser"
	);
}
