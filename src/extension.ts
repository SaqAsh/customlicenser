import * as vscode from "vscode";

import {
    disableAutoAddOnSave,
    enableAutoAddOnSave,
    isAutoAddOnSaveEnabled,
} from "./BackgroundUtilities/autoAddOnSave.ts";
import { determineCommentType } from "./loggers/comment-style-detector.ts";
import {
    getLicenseDetector,
    startLicenseDetection,
    stopLicenseDetection,
} from "./BackgroundUtilities/licenseDetector.ts";
import {
    processLicenseTemplate,
    readLicenseTemplate,
} from "./loggers/license-inserter.ts";
import { checkIfLicenseExists } from "./utils/check-if-license-exists.ts";
import { addCustomLicense } from "./commands/CommandsToRefactor/addCustomLicense.ts";
import { setYear } from "./commands/addYear.ts";
import { applyLicenseToCurrentFile } from "./utils/applyLicenseToCurrentFile.ts";
import {
    createNewCustomLicense,
    editCustomLicense,
} from "./commands/CommandsToRefactor/editCustomLicense.ts";
import { selectDefaultLicense } from "./commands/selectDefaultLicense.ts";
import { selectLicenseToAdd } from "./commands/selectLicenseToAdd.ts";
import { configureAutoAddOnSave } from "./commands/toggleAutoAddOnSave.ts";
import { getLicenseOptions } from "./utils/getLicenseOptions.ts";
import { displayInputBox } from "./utils/inputBox.ts";
import error from "./loggers/error.ts";
import info from "./loggers/info.ts";
import warn from "./loggers/warn.ts";

const addLicenseToFile = async (licenseType?: string): Promise<void> => {
    try {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            error("No active file to add license to");
            return;
        }

        if (await checkIfLicenseExists(editor.document)) {
            const overwrite = await warn(
                "A license may already exist in this file. Do you want to add another one?",
                [{ title: "Yes" }, { title: "No" }]
            );
            if (overwrite?.title !== "Yes") {
                return;
            }
        }

        // Get license option
        let licenseOption;
        if (licenseType) {
            const options = getLicenseOptions();
            licenseOption = options.find(
                (opt: any) => opt.type === licenseType
            );
        } else {
            licenseOption = await selectLicenseToAdd();
        }

        if (!licenseOption) {
            return;
        }

        // Get comment type
        const commentType = await determineCommentType();
        if (commentType === undefined) {
            error("Unable to determine comment type for this file");
            return;
        }

        // Read and process license
        const licenseTemplate = await readLicenseTemplate(licenseOption);
        if (licenseTemplate === undefined) {
            error("Failed to read license template");
            return;
        }

        const config = vscode.workspace.getConfiguration("customlicenser");
        const userName = config.get<string>("authorName") || "Your Name";
        const userEmail =
            config.get<string>("authorEmail") || "your.email@example.com";

        const processedTemplate = processLicenseTemplate(licenseTemplate, {
            name: userName,
            email: userEmail,
        });

        const res = await applyLicenseToCurrentFile(processedTemplate);

        if (res === true) {
            info("License successfully added to current file");
        } else {
            error("Failed to add license to current file");
            return undefined;
        }
    } catch (err) {
        error(`Failed to add license: ${err}`);
    }
};

/**
 * Activates the CustomLicenser extension.
 *
 * Initializes background services including license detection and auto-add functionality.
 * Registers all VS Code commands for license management operations.
 *
 * @param context - The VS Code extension context for managing subscriptions and lifecycle
 */
export function activate(context: vscode.ExtensionContext) {
    // Start background services
    startLicenseDetection();

    // Enable auto-add on save if configured
    if (isAutoAddOnSaveEnabled()) {
        enableAutoAddOnSave();
    }

    const commands = [
        {
            command: "customlicenser.toggleAutoSave",
            callback: async () => {
                const isEnabled = await configureAutoAddOnSave();
                const config: vscode.WorkspaceConfiguration =
                    vscode.workspace.getConfiguration("customlicenser");

                if (isEnabled === undefined) {
                    error("Unable to set default toggle on save");
                    await config.update(
                        "toggleOnSave",
                        false,
                        vscode.ConfigurationTarget.Workspace
                    );
                    disableAutoAddOnSave();
                } else if (isEnabled === true) {
                    info("Successfully enabled autoSave ");
                    await config.update(
                        "toggleOnSave",
                        true,
                        vscode.ConfigurationTarget.Workspace
                    );
                    enableAutoAddOnSave();
                } else {
                    info("Successfully disabled autoSave ");
                    await config.update(
                        "toggleOnSave",
                        false,
                        vscode.ConfigurationTarget.Workspace
                    );
                    disableAutoAddOnSave();
                }
            },
        },
        {
            command: "customlicenser.addYear",
            callback: async () => {
                const year = await setYear();
                if (year !== undefined) {
                    info(`Year has been saved to: ${year}`);
                } else {
                    error("Enable to save year, please try again ");
                }
            },
        },
        {
            command: "customlicenser.addName",
            callback: async () => {
                const name = await displayInputBox({
                    prompt: "Enter your name for license headers",
                    placeHolder: "Your Name",
                    ignoreFocusOut: true,
                });

                if (name) {
                    const config =
                        vscode.workspace.getConfiguration("customlicenser");
                    await config.update(
                        "authorName",
                        name,
                        vscode.ConfigurationTarget.Workspace
                    );
                    info(`Author name set to: ${name}`);
                }
            },
        },
        {
            command: "customlicenser.selectLicense",
            callback: () => addLicenseToFile(),
        },
        {
            command: "customlicenser.addMITLicense",
            callback: () => addLicenseToFile("MIT"),
        },
        {
            command: "customlicenser.addGPLLicense",
            callback: () => addLicenseToFile("GPL"),
        },
        {
            command: "customlicenser.addApacheLicense",
            callback: () => addLicenseToFile("Apache"),
        },
        {
            command: "customlicenser.addBSDLicense",
            callback: () => addLicenseToFile("BSD"),
        },
        {
            command: "customlicenser.addISCLicense",
            callback: () => addLicenseToFile("ISC"),
        },
        {
            command: "customlicenser.addMozillaLicense",
            callback: () => addLicenseToFile("Mozilla"),
        },
        {
            command: "customlicenser.addCustomLicense",
            callback: async () => {
                const success = await addCustomLicense();
                if (success === undefined) {
                    error("Failed to add custom license");
                }
            },
        },
        {
            command: "customlicenser.manageCustomLicenses",
            callback: async () => {
                const success = await editCustomLicense();
                if (success === undefined) {
                    info("No changes made to custom licenses");
                }
            },
        },
        {
            command: "customlicenser.createCustomLicense",
            callback: async () => {
                const success = await createNewCustomLicense();
                if (success === undefined) {
                    error("Failed to create custom license");
                }
            },
        },
        {
            command: "customlicenser.selectDefaultLicense",
            callback: async () => {
                const success = await selectDefaultLicense();
                if (success === undefined) {
                    info("No default license selected");
                }
            },
        },
        {
            command: "customlicenser.checkLicenseCoverage",
            callback: () => {
                const detector = getLicenseDetector();
                if (!detector) {
                    error("License detection not running");
                    return;
                }

                const statuses = detector.getLicenseStatuses();
                const filesWithoutLicense = detector.getFilesWithoutLicense();

                if (statuses.length === 0) {
                    info("No code files detected in workspace");
                    return;
                }

                const totalFiles = statuses.length;
                const filesWithLicense =
                    totalFiles - filesWithoutLicense.length;
                const percentage = Math.round(
                    (filesWithLicense / totalFiles) * 100
                );

                const message =
                    `License Coverage Report:\n` +
                    `Files with licenses: ${filesWithLicense}/${totalFiles} (${percentage}%)\n` +
                    `Files without licenses: ${filesWithoutLicense.length}`;

                if (filesWithoutLicense.length > 0) {
                    const fileList = filesWithoutLicense
                        .slice(0, 10) // Show first 10 files
                        .map((status: any) => status.filePath.split("/").pop())
                        .join(", ");

                    const fullMessage =
                        message +
                        `\n\nFiles without licenses: ${fileList}` +
                        (filesWithoutLicense.length > 10
                            ? ` and ${filesWithoutLicense.length - 10} more...`
                            : "");

                    warn(fullMessage);
                } else {
                    info(message + "\n\nAll files have licenses! 🎉");
                }
            },
        },
        {
            command: "customlicenser.configureSettings",
            callback: () => {
                vscode.commands.executeCommand(
                    "workbench.action.openSettings",
                    "customlicenser"
                );
            },
        },
    ];

    commands.forEach(({ command, callback }) => {
        const disposable = vscode.commands.registerCommand(command, callback);
        context.subscriptions.push(disposable);
    });
}

export function deactivate() {
    stopLicenseDetection();
    disableAutoAddOnSave();
}
