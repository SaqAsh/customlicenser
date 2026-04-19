import * as vscode from 'vscode';

/**
 * Logs an info message to the console and surfaces a non-modal toast.
 * Fire-and-forget: the returned toast promise is intentionally detached
 * because no call site waits on the user's response.
 */
export function info(message: string): void {
  console.info(message);
  void vscode.window.showInformationMessage(message);
}
