import * as vscode from "vscode";

/**
 * Displays an information message to the user.
 * @param message Information message to display
 */
const info = async <T extends vscode.MessageItem>(
    message: string,
    items?: T[]
): Promise<T | undefined> => {
    console.info(message);
    return await vscode.window.showInformationMessage(
        message,
        ...(items || [])
    );
};

export default info;
