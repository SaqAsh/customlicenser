import * as vscode from "vscode";

/**
 * Updates the workspace configuration for the specified license setting.
 * @param userPreference - The new value for the configuration (e.g., true, false, or a string).
 * @param configurationName - The name of the configuration setting to update.
 * @returns A promise that resolves when the update is complete.
 */
export const updatePreference = async <T>(
	userPreference: T,
	configurationName: string
): Promise<void> => {
	const vsCodeConfiguration =
		vscode.workspace.getConfiguration("customlicenser");
	return vsCodeConfiguration.update(
		configurationName,
		userPreference,
		vscode.ConfigurationTarget.Global
	);
};
