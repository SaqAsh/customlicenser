import * as vscode from "vscode";

/***
 *  @param valuesToDisplay - Array of values to display in the quick pick
 *  @param placeHolder - Placeholder text for the quick pick
 *  @param canPickMany - Whether multiple selections are allowed
 *  @return Promise that resolves to the selected value or undefined if cancelled
 */
export const displayQuickPick = (
    valuesToDisplay: string[],
    placeHolder: string,
    canPickMany: boolean
): Thenable<string | undefined> => {
    return vscode.window.showQuickPick(valuesToDisplay, {
        placeHolder: placeHolder,
        canPickMany: canPickMany,
    });
};
