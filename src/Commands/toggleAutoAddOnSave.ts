import * as vscode from "vscode";

import { displayQuickPick } from "../utils/quickPick";
import { updatePreference } from "../utils/updatePreference";

/**
 * Toggles the auto-add license on save functionality.
 * Shows confirmation dialog and updates workspace configuration.
 * Enables/disables automatic license insertion when files are saved.
 * @returns Promise resolving to current state (true=enabled, false=disabled, undefined=error)
 */
const setAutoAddOnSavePreference = async (
	userPreference: boolean
): Promise<void> => {
	const configurationName = "autoAddOnSave";
	updatePreference(userPreference, configurationName);
};

/**
 * Configures the auto-add license on save functionality.
 * Prompts the user to enable or disable the feature, updates settings accordingly,
 * and returns the new state.
 *
 * @returns Promise resolving to the selected state (true = enabled, false = disabled, undefined = cancelled or error)
 */
export const configureAutoAddOnSave = async (): Promise<
	boolean | undefined
> => {
	try {
		const selection = await displayQuickPick(
			["Enable", "Disable"],
			"Enable or Disable auto add license",
			false,
			true
		);

		if (!selection) return;

		const preference = selection === "Enable";
		await setAutoAddOnSavePreference(preference);

		return preference;
	} catch (error) {
		vscode.window.showErrorMessage(
			`Error updating auto-add on save setting: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
		return;
	}
};
