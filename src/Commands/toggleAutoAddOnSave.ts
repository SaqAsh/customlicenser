import * as vscode from "vscode";

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
export const toggleAutoAddOnSave = async (): Promise<boolean | undefined> => {
	const save = await displayQuickPick(
		["Enable", "Disable"],
		"Enable or Disable auto add license",
		false
	);

	if (save === undefined) {
		return undefined;
	}

	return save === "Enable" ? true : false;
};
