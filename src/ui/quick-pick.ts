import * as vscode from "vscode";
import { QuickPickItem } from "vscode";

/***
 *  @param valuesToDisplay - Array of values to display in the quick pick
 *  @param placeHolder - Placeholder text for the quick pick
 *  @param canPickMany - Whether multiple selections are allowed
 * 	@param ignoreFocusOUt - Focus out
 *  @param matchOnDescription - include description when checking pick
 *  @return Promise that resolves to the selected value or undefined if cancelled
 */
export const displayQuickPick = <T extends QuickPickItem>(
	valuesToDisplay: T[],
	placeHolder: string,
	canPickMany: boolean,
	ignoreFocusOut: boolean,
	matchOnDescription: boolean = true
): Thenable<T | undefined> => {
	return vscode.window.showQuickPick(valuesToDisplay, {
		placeHolder: placeHolder,
		canPickMany: canPickMany,
		ignoreFocusOut: ignoreFocusOut,
		matchOnDescription: matchOnDescription,
	});
};
