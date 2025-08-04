import * as vscode from "vscode";
import { LicenseManager, TemplateManager } from "./managers";
import { ConfigService, FileService, TemplateService } from "./services";
import { LicenseTemplate } from "./types";
import { error, info, warn } from "./loggers";

// Global managers - will be initialized in activate()
let licenseManager: LicenseManager;
let templateManager: TemplateManager;

/**
 * Activates the CustomLicenser extension.
 *
 * Initializes the manager-based architecture with proper dependency injection.
 * Registers all VS Code commands for license management operations.
 *
 * @param context - The VS Code extension context for managing subscriptions and lifecycle
 */
export async function activate(context: vscode.ExtensionContext) {
	try {
		console.log("CustomLicenser: Starting activation...");

		// Initialize services with dependency injection
		const configService = new ConfigService();
		const fileService = new FileService();

		// Create default license template for template service
		const defaultTemplate: LicenseTemplate = {
			name: "mit",
			content: "MIT License template",
		};
		const templateService = new TemplateService(
			configService,
			defaultTemplate
		);

		licenseManager = new LicenseManager(
			configService,
			templateService,
			fileService
		);
		templateManager = new TemplateManager(templateService);

		console.log("CustomLicenser: Managers initialized");

		// Start license manager
		try {
			await licenseManager.start();
		} catch (err) {
			console.warn(
				"CustomLicenser: Failed to start license manager:",
				err
			);
		}

		// Enable auto-save if configured (but don't fail activation if it fails)
		try {
			if (licenseManager.isAutoSaveEnabled()) {
				await licenseManager.enableAutoSave();
				console.log("CustomLicenser: Auto-save enabled");
			}
		} catch (err) {
			console.warn("CustomLicenser: Failed to enable auto-save:", err);
		}

		// Register commands
		const commands = [
			// Test command to verify extension is working
			{
				command: "customlicenser.test",
				callback: async () => {
					try {
						console.log(
							"Extension: Test command called - extension is working!"
						);
						await info(
							"CustomLicenser extension is working! Test command executed successfully."
						);
					} catch (err) {
						const errorMessage =
							err instanceof Error
								? err.message
								: "Unknown error occurred";
						await error(
							`Test command failed: ${errorMessage}`,
							err instanceof Error ? err : undefined
						);
					}
				},
			},
			// Configuration commands
			{
				command: "customlicenser.addYear",
				callback: async () => {
					try {
						const year = await vscode.window.showInputBox({
							prompt: "Enter the year for license headers",
							placeHolder: new Date().getFullYear().toString(),
							value: new Date().getFullYear().toString(),
							ignoreFocusOut: true,
							validateInput: (value) => {
								const yearNum = parseInt(value);
								if (
									isNaN(yearNum) ||
									yearNum < 1900 ||
									yearNum > 2100
								) {
									return "Please enter a valid year between 1900 and 2100";
								}
								return null;
							},
						});

						if (year) {
							await configService.updateYear(year);
							await info(`Year updated to: ${year}`);
						}
					} catch (err) {
						const errorMessage =
							err instanceof Error
								? err.message
								: "Unknown error occurred";
						await error(
							`Failed to update year: ${errorMessage}`,
							err instanceof Error ? err : undefined
						);
					}
				},
			},
			{
				command: "customlicenser.addName",
				callback: async () => {
					try {
						const name = await vscode.window.showInputBox({
							prompt: "Enter your name for license headers",
							placeHolder: "Your Name",
							ignoreFocusOut: true,
							validateInput: (value) => {
								if (!value || value.trim().length === 0) {
									return "Name cannot be empty";
								}
								return null;
							},
						});

						if (name) {
							await configService.updateAuthorName(name);
							await info(`Author name set to: ${name}`);
						}
					} catch (err) {
						const errorMessage =
							err instanceof Error
								? err.message
								: "Unknown error occurred";
						await error(
							`Failed to update author name: ${errorMessage}`,
							err instanceof Error ? err : undefined
						);
					}
				},
			},
			{
				command: "customlicenser.toggleAutoSave",
				callback: async () => {
					try {
						if (licenseManager.isAutoSaveEnabled()) {
							await licenseManager.disableAutoSave();
							await info("Auto-save disabled");
						} else {
							await licenseManager.enableAutoSave();
							await info("Auto-save enabled");
						}
					} catch (err) {
						const errorMessage =
							err instanceof Error
								? err.message
								: "Unknown error occurred";
						await error(
							`Failed to toggle auto-save: ${errorMessage}`,
							err instanceof Error ? err : undefined
						);
					}
				},
			},
			// Standard license commands
			{
				command: "customlicenser.selectLicense",
				callback: async () => {
					try {
						const availableLicenses =
							await licenseManager.getAvailableLicenses();

						if (availableLicenses.length === 0) {
							await info(
								"No licenses available. Create some licenses first."
							);
							return;
						}

						const selectedLicense =
							await vscode.window.showQuickPick(
								availableLicenses,
								{
									placeHolder:
										"Select a license to add to the current file",
								}
							);

						if (selectedLicense) {
							const success =
								await licenseManager.addLicenseToFile(
									selectedLicense as any
								);
							if (success) {
								await info(
									`${selectedLicense} license added successfully`
								);
							} else {
								await warn(
									"License addition was cancelled or failed"
								);
							}
						}
					} catch (err) {
						const errorMessage =
							err instanceof Error
								? err.message
								: "Unknown error occurred";
						await error(
							`Failed to add license: ${errorMessage}`,
							err instanceof Error ? err : undefined
						);
					}
				},
			},
			{
				command: "customlicenser.addMITLicense",
				callback: async () => {
					try {
						console.log("Extension: addMITLicense command called");
						const success = await licenseManager.addLicenseToFile(
							"mit"
						);
						if (success) {
							await info("MIT license added successfully");
						} else {
							await warn(
								"MIT license addition was cancelled or failed"
							);
						}
					} catch (err) {
						const errorMessage =
							err instanceof Error
								? err.message
								: "Unknown error occurred";
						await error(
							`Failed to add MIT license: ${errorMessage}`,
							err instanceof Error ? err : undefined
						);
					}
				},
			},
			{
				command: "customlicenser.addGPLLicense",
				callback: async () => {
					try {
						const success = await licenseManager.addLicenseToFile(
							"gpl"
						);
						if (success) {
							await info("GPL license added successfully");
						} else {
							await warn(
								"GPL license addition was cancelled or failed"
							);
						}
					} catch (err) {
						const errorMessage =
							err instanceof Error
								? err.message
								: "Unknown error occurred";
						await error(
							`Failed to add GPL license: ${errorMessage}`,
							err instanceof Error ? err : undefined
						);
					}
				},
			},
			{
				command: "customlicenser.addApacheLicense",
				callback: async () => {
					try {
						const success = await licenseManager.addLicenseToFile(
							"apache"
						);
						if (success) {
							await info("Apache license added successfully");
						} else {
							await warn(
								"Apache license addition was cancelled or failed"
							);
						}
					} catch (err) {
						const errorMessage =
							err instanceof Error
								? err.message
								: "Unknown error occurred";
						await error(
							`Failed to add Apache license: ${errorMessage}`,
							err instanceof Error ? err : undefined
						);
					}
				},
			},
			{
				command: "customlicenser.addBSDLicense",
				callback: async () => {
					try {
						const success = await licenseManager.addLicenseToFile(
							"bsd"
						);
						if (success) {
							await info("BSD license added successfully");
						} else {
							await warn(
								"BSD license addition was cancelled or failed"
							);
						}
					} catch (err) {
						const errorMessage =
							err instanceof Error
								? err.message
								: "Unknown error occurred";
						await error(
							`Failed to add BSD license: ${errorMessage}`,
							err instanceof Error ? err : undefined
						);
					}
				},
			},
			{
				command: "customlicenser.addISCLicense",
				callback: async () => {
					try {
						const success = await licenseManager.addLicenseToFile(
							"isc"
						);
						if (success) {
							await info("ISC license added successfully");
						} else {
							await warn(
								"ISC license addition was cancelled or failed"
							);
						}
					} catch (err) {
						const errorMessage =
							err instanceof Error
								? err.message
								: "Unknown error occurred";
						await error(
							`Failed to add ISC license: ${errorMessage}`,
							err instanceof Error ? err : undefined
						);
					}
				},
			},
			{
				command: "customlicenser.addMozillaLicense",
				callback: async () => {
					try {
						const success = await licenseManager.addLicenseToFile(
							"mozilla"
						);
						if (success) {
							await info("Mozilla license added successfully");
						} else {
							await warn(
								"Mozilla license addition was cancelled or failed"
							);
						}
					} catch (err) {
						const errorMessage =
							err instanceof Error
								? err.message
								: "Unknown error occurred";
						await error(
							`Failed to add Mozilla license: ${errorMessage}`,
							err instanceof Error ? err : undefined
						);
					}
				},
			},
			// Custom license commands
			{
				command: "customlicenser.createCustomLicense",
				callback: async () => {
					try {
						console.log(
							"Extension: createCustomLicense command called"
						);

						const templateName = await vscode.window.showInputBox({
							prompt: "Enter a name for your custom license template",
							placeHolder: "My Custom License",
							ignoreFocusOut: true,
							validateInput: (value) => {
								if (!value || value.trim().length === 0) {
									return "Template name cannot be empty";
								}
								return null;
							},
						});

						console.log(
							`Extension: Template name received: "${templateName}"`
						);

						if (templateName) {
							console.log(
								"Extension: Calling templateManager.handleTemplateCreation"
							);
							await templateManager.handleTemplateCreation(
								templateName as any
							);
						}
					} catch (err) {
						const errorMessage =
							err instanceof Error
								? err.message
								: "Unknown error occurred";
						console.error(
							"Extension: Error in createCustomLicense:",
							err
						);
						await error(
							`Failed to create custom license: ${errorMessage}`,
							err instanceof Error ? err : undefined
						);
					}
				},
			},
			{
				command: "customlicenser.editCustomLicense",
				callback: async () => {
					try {
						const availableLicenses =
							await licenseManager.getAvailableLicenses();

						if (availableLicenses.length === 0) {
							await info(
								"No custom licenses available. Create one first."
							);
							return;
						}

						const selectedLicense =
							await vscode.window.showQuickPick(
								availableLicenses,
								{
									placeHolder:
										"Select a custom license to edit",
								}
							);

						if (selectedLicense) {
							await templateManager.handleTemplateEditing(
								selectedLicense
							);
						}
					} catch (err) {
						const errorMessage =
							err instanceof Error
								? err.message
								: "Unknown error occurred";
						await error(
							`Failed to edit custom license: ${errorMessage}`,
							err instanceof Error ? err : undefined
						);
					}
				},
			},
			{
				command: "customlicenser.selectDefaultLicense",
				callback: async () => {
					try {
						const availableLicenses =
							await licenseManager.getAvailableLicenses();

						if (availableLicenses.length === 0) {
							await info(
								"No licenses available. Create some licenses first."
							);
							return;
						}

						const selectedLicense =
							await vscode.window.showQuickPick(
								availableLicenses,
								{
									placeHolder: "Select your default license",
								}
							);

						if (selectedLicense) {
							const defaultTemplate =
								licenseManager.getDefaultLicense();
							// Update the default license in config
							await configService.updateDefaultLicense({
								name: selectedLicense as any,
								content: defaultTemplate.content,
							});
							await info(
								`Default license set to: ${selectedLicense}`
							);
						}
					} catch (err) {
						const errorMessage =
							err instanceof Error
								? err.message
								: "Unknown error occurred";
						await error(
							`Failed to select default license: ${errorMessage}`,
							err instanceof Error ? err : undefined
						);
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

		// Register all commands
		commands.forEach(({ command, callback }) => {
			const disposable = vscode.commands.registerCommand(
				command,
				callback
			);
			context.subscriptions.push(disposable);
		});

		await info("CustomLicenser extension activated successfully");
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown error occurred";
		await error(
			`Failed to activate extension: ${errorMessage}`,
			err instanceof Error ? err : undefined
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
