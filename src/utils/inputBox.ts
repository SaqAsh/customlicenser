import * as vscode from "vscode";
import { InputBoxOptions } from "vscode";

/**
 * @param options - Input box options to configure the input box
 * @return Promise that resolves to the entered string or undefined if cancelled
 */
export const displayInputBox = (
	options: InputBoxOptions
): Thenable<string | undefined> => {
	return vscode.window.showInputBox(options);
};
