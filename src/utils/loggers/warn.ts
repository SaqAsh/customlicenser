import * as vscode from "vscode";
import { MessageItem } from "vscode";

/**
 * Displays a warning message to the user.
 * @param message The warning message to display
 */
const warn = async <T extends MessageItem>(
    message: string,
    items?: T[]
): Promise<T | undefined> => {
    console.warn(message);
    return await vscode.window.showWarningMessage(message, ...(items || []));
};

export default warn;
