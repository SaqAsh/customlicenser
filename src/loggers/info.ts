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

	// Use non-blocking notification instead of modal dialog
	vscode.window.showInformationMessage(message, ...(items || []));

	// Return undefined since we're not waiting for user interaction
	return undefined;
};

export default info;
