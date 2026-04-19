import * as vscode from 'vscode';

/**
 * Logs a warning to the console and surfaces a non-modal warning toast.
 * Fire-and-forget: the returned toast promise is intentionally detached
 * because no call site waits on the user's response.
 */
export function warn(message: string): void {
  console.warn(message);
  void vscode.window.showWarningMessage(message);
}
