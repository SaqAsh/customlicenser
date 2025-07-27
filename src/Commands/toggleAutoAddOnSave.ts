import * as vscode from "vscode";
/**
 * Prompts the user to enable or disable the automatic addition of a license on file save.
 *
 * @returns A Promise that resolves to `true` if "Enable" is selected, `false` if "Disable" is selected, or `undefined` if the user cancels.
 *
 * @example
 * ```typescript
 * const isEnabled = await toggleAutoAddOnSave();
 * if (isEnabled === true) {
 *   // Auto add license on save is enabled
 * } else if (isEnabled === false) {
 *   // Auto add license on save is disabled
 * } else {
 *   // User cancelled the selection
 * }
 * ```
 *
 * @description
 * This function:
 * 1. Shows a quick pick dialog with "Enable" and "Disable" options.
 * 2. Returns `true` if "Enable" is selected, `false` if "Disable" is selected, undefined if user has dismissed
 */

/**
 * Toggles the auto-add license on save functionality.
 *
 * Shows confirmation dialog and updates workspace configuration.
 * Enables/disables automatic license insertion when files are saved.
 *
 * @returns Promise resolving to current state (true=enabled, false=disabled, undefined=error)
 */
export const toggleAutoAddOnSave = async (): Promise<boolean | undefined> => {
	const save = await vscode.window.showQuickPick(["Enable", "Disable"], {
		placeHolder: "Enable or Disable auto add license on save",
		canPickMany: false,
	});
	return save === undefined ? undefined : save === "Enable" ? true : false;
};
