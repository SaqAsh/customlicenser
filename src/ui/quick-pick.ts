import * as vscode from 'vscode';
import {type QuickPickItem} from 'vscode';

/**
 * Show a quick pick and resolve with the user's choice.
 *
 * @param valuesToDisplay - items rendered in the list
 * @param placeHolder - placeholder prompt
 * @param canPickMany - whether multiple selections are allowed
 * @param ignoreFocusOut - keep the picker open when focus leaves
 * @param matchOnDescription - include description text in filter matching
 */
export function displayQuickPick<T extends QuickPickItem>(
  valuesToDisplay: T[],
  placeHolder: string,
  canPickMany: boolean,
  ignoreFocusOut: boolean,
  matchOnDescription = true,
): Thenable<T | undefined> {
  return vscode.window.showQuickPick(valuesToDisplay, {
    placeHolder,
    canPickMany,
    ignoreFocusOut,
    matchOnDescription,
  });
}
