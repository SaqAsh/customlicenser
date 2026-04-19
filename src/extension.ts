import * as vscode from 'vscode';

import {
  addApacheLicenseCommand,
  addBSDLicenseCommand,
  addGPLLicenseCommand,
  addISCLicenseCommand,
  addMITLicenseCommand,
  addMozillaLicenseCommand,
  addNameCommand,
  addYearCommand,
  configureSettingsCommand,
  createCustomLicenseCommand,
  editCustomLicenseCommand,
  selectDefaultLicenseCommand,
  selectLicenseCommand,
  toggleAutoCorrectCommand,
  toggleAutoSaveCommand,
} from './commands';
import {error} from './loggers';
import {LicenseManager, TemplateManager} from './managers';
import {
  ConfigService,
  FileService,
  TemplateLoader,
  TemplateService,
} from './services';

let licenseManager: LicenseManager | undefined;

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  try {
    const configService = new ConfigService();
    const fileService = new FileService(configService);
    const templateLoader = new TemplateLoader(context.extensionUri.fsPath);
    const templateService = new TemplateService(configService, templateLoader);
    const mgr = new LicenseManager(configService, templateService, fileService);
    const templateManager = new TemplateManager(templateService);
    licenseManager = mgr;

    await safe('start license manager', () => mgr.start());
    if (mgr.isAutoSaveEnabled) {
      await safe('enable auto-save', async () => {
        await mgr.enableAutoSave();
      });
    }

    const registry: Record<string, () => unknown> = {
      'customlicenser.addYear': () => addYearCommand(configService),
      'customlicenser.addName': () => addNameCommand(configService),
      'customlicenser.toggleAutoSave': () => toggleAutoSaveCommand(mgr),
      'customlicenser.toggleAutoCorrect': () => toggleAutoCorrectCommand(mgr),
      'customlicenser.selectLicense': () => selectLicenseCommand(mgr),
      'customlicenser.addMITLicense': () => addMITLicenseCommand(mgr),
      'customlicenser.addGPLLicense': () => addGPLLicenseCommand(mgr),
      'customlicenser.addApacheLicense': () => addApacheLicenseCommand(mgr),
      'customlicenser.addBSDLicense': () => addBSDLicenseCommand(mgr),
      'customlicenser.addISCLicense': () => addISCLicenseCommand(mgr),
      'customlicenser.addMozillaLicense': () => addMozillaLicenseCommand(mgr),
      'customlicenser.createCustomLicense': () =>
        createCustomLicenseCommand(templateManager),
      'customlicenser.editCustomLicense': () =>
        editCustomLicenseCommand(mgr, templateManager),
      'customlicenser.selectDefaultLicense': () =>
        selectDefaultLicenseCommand(mgr, configService, templateService),
      'customlicenser.configureSettings': configureSettingsCommand,
    };

    Object.entries(registry).forEach(([command, callback]) =>
      context.subscriptions.push(
        vscode.commands.registerCommand(command, callback),
      ),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    error(
      `Failed to activate extension: ${message}`,
      err instanceof Error ? err : undefined,
    );
  }
}

export async function deactivate(): Promise<void> {
  try {
    await licenseManager?.stop();
    licenseManager = undefined;
    console.info('CustomLicenser extension deactivated');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Failed to deactivate extension: ${message}`, err);
  }
}

async function safe(action: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    error(`Extension activation: Failed to ${action}: ${message}`);
  }
}
