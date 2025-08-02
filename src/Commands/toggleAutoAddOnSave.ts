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
 * Toggles the auto-add license on save functionality.
 * Shows confirmation dialog and updates workspace configuration.
 * Enables/disables automatic license insertion when files are saved.
 * @returns Promise resolving to current state (true=enabled, false=disabled, undefined=error)
 */
export const toggleAutoAddOnSave = async (): Promise<boolean | undefined> => {
    try {
        const save = await displayQuickPick(
            ["Enable", "Disable"],
            "Enable or Disable auto add license",
            false
        );

        if (save === undefined) {
            return undefined;
        }

        const preference = save === "Enable" ? true : false;
        const autoAddOnSavePreference = await setAutoAddOnSavePreference(
            preference
        );

        return true;
    } catch (error) {
        vscode.window.showErrorMessage(
            `Error toggling auto-add on save: ${
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred"
            }`
        );
        return undefined;
    }
};
