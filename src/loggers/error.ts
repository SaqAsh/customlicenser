import * as vscode from 'vscode';

/**
 * Logs an error to the console and surfaces a non-modal error toast.
 * Fire-and-forget: the returned toast promise is intentionally detached
 * because no call site waits on the user's response.
 */
export function error(message: string, err?: Error): void {
  console.error(message, err);
  void vscode.window.showErrorMessage(`Error: ${message}`);
}
