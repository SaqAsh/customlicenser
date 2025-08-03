import * as vscode from "vscode";
import { MessageItem } from "vscode";

/**
 * Displays an error message to the user and logs it to the console.
 * @param message Error message to display
 * @param error Optional Error object for additional context
 */
const error = async <T extends MessageItem>(
    message: string,
    error?: Error,
    items?: T[]
): Promise<T | undefined> => {
    console.error(message, error);
    return await vscode.window.showErrorMessage(
        `Error: ${message}`,
        ...(items || [])
    );
};

export default error;
