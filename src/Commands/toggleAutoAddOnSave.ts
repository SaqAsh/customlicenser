import * as vscode from "vscode";

/***
 *  @param valuesToDisplay - Array of values to display in the quick pick
 *  @param placeHolder - Placeholder text for the quick pick
 *  @param canPickMany - Whether multiple selections are allowed
 *  @return Promise that resolves to the selected value or undefined if cancelled
 */
const displayQuickPick = (
    valuesToDisplay: string[],
    placeHolder: string,
    canPickMany: boolean
) => {
    return vscode.window.showQuickPick(valuesToDisplay, {
        placeHolder: placeHolder,
        canPickMany: canPickMany,
    });
};

/**
 * Toggles the auto-add license on save functionality.
 * Shows confirmation dialog and updates workspace configuration.
 * Enables/disables automatic license insertion when files are saved.
 * @returns Promise resolving to current state (true=enabled, false=disabled, undefined=error)
 */
const setAutoAddOnSavePreference = async (
    userPreference: boolean
): Promise<void> => {
    const vsCodeConfiguration =
        vscode.workspace.getConfiguration("customlicenser");
    return vsCodeConfiguration.update(
        "autoAddOnSave",
        userPreference,
        vscode.ConfigurationTarget.Workspace
    );
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
