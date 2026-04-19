import * as vscode from 'vscode';

export function configureSettingsCommand(): Thenable<unknown> {
  return vscode.commands.executeCommand(
    'workbench.action.openSettings',
    'customlicenser',
  );
}
