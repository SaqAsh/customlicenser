import * as vscode from "vscode";

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
  toggleAutoSaveCommand,
} from "./commands";
import "./handlers/try-catch";
import { error } from "./loggers";
import { LicenseManager, TemplateManager } from "./managers";
import { ConfigService, FileService, TemplateService } from "./services";
import { LicenseTemplate } from "./types";

let licenseManager: LicenseManager;
let templateManager: TemplateManager;

export async function activate(context: vscode.ExtensionContext) {
  try {
    const configService = new ConfigService();
    const fileService = new FileService();

    const defaultTemplate: LicenseTemplate = {
      name: "mit",
      content: "MIT License template",
    };

    const templateService = new TemplateService(configService, defaultTemplate);

    licenseManager = new LicenseManager(
      configService,
      templateService,
      fileService,
    );
    templateManager = new TemplateManager(templateService);

    try {
      await licenseManager.start();
    } catch (err) {
      console.warn("CustomLicenser: Failed to start license manager:", err);
    }

    try {
      if (licenseManager.isAutoSaveEnabled) {
        await licenseManager.enableAutoSave();
      }
    } catch (err) {
      console.warn("CustomLicenser: Failed to enable auto-save:", err);
    }

    const commands = [
      {
        command: "customlicenser.addYear",
        callback: () => addYearCommand(configService),
      },
      {
        command: "customlicenser.addName",
        callback: () => addNameCommand(configService),
      },
      {
        command: "customlicenser.toggleAutoSave",
        callback: () => toggleAutoSaveCommand(licenseManager),
      },
      {
        command: "customlicenser.selectLicense",
        callback: () => selectLicenseCommand(licenseManager),
      },
      {
        command: "customlicenser.addMITLicense",
        callback: () => addMITLicenseCommand(licenseManager),
      },
      {
        command: "customlicenser.addGPLLicense",
        callback: () => addGPLLicenseCommand(licenseManager),
      },
      {
        command: "customlicenser.addApacheLicense",
        callback: () => addApacheLicenseCommand(licenseManager),
      },
      {
        command: "customlicenser.addBSDLicense",
        callback: () => addBSDLicenseCommand(licenseManager),
      },
      {
        command: "customlicenser.addISCLicense",
        callback: () => addISCLicenseCommand(licenseManager),
      },
      {
        command: "customlicenser.addMozillaLicense",
        callback: () => addMozillaLicenseCommand(licenseManager),
      },
      {
        command: "customlicenser.createCustomLicense",
        callback: () => createCustomLicenseCommand(templateManager),
      },
      {
        command: "customlicenser.editCustomLicense",
        callback: () =>
          editCustomLicenseCommand(licenseManager, templateManager),
      },
      {
        command: "customlicenser.selectDefaultLicense",
        callback: () =>
          selectDefaultLicenseCommand(licenseManager, configService),
      },
      {
        command: "customlicenser.configureSettings",
        callback: configureSettingsCommand,
      },
    ];

    commands.forEach(({ command, callback }) => {
      const disposable = vscode.commands.registerCommand(command, callback);
      context.subscriptions.push(disposable);
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    await error(
      `Failed to activate extension: ${errorMessage}`,
      err instanceof Error ? err : undefined,
    );
  }
}

export function deactivate() {
  try {
    if (licenseManager) {
      licenseManager.stop();
    }
    console.info("CustomLicenser extension deactivated");
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error(`Failed to deactivate extension: ${errorMessage}`, err);
  }
}
