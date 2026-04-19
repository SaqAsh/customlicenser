import * as vscode from 'vscode';
import {type InputBoxOptions} from 'vscode';

/**
 * Thin wrapper around `window.showInputBox` so call sites can be mocked
 * in tests without reaching into the `vscode` namespace directly.
 */
export function displayInputBox(
  options: InputBoxOptions,
): Thenable<string | undefined> {
  return vscode.window.showInputBox(options);
}
