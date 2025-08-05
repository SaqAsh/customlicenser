import * as vscode from "vscode";
import { error, info } from "../loggers";
import { LicenseManager, TemplateManager } from "../managers";
import { ConfigService } from "../services";

export async function createCustomLicenseCommand(
	templateManager: TemplateManager
): Promise<void> {
	try {
		console.log("Extension: createCustomLicense command called");

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

		console.log(`Extension: Template name received: "${templateName}"`);

		if (templateName) {
			console.log(
				"Extension: Calling templateManager.handleTemplateCreation"
			);
			await templateManager.handleTemplateCreation(templateName as any);
		}
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown error occurred";
		console.error("Extension: Error in createCustomLicense:", err);
		await error(
			`Failed to create custom license: ${errorMessage}`,
			err instanceof Error ? err : undefined
		);
	}
}

export async function editCustomLicenseCommand(
	licenseManager: LicenseManager,
	templateManager: TemplateManager
): Promise<void> {
	try {
		const availableLicenses = await licenseManager.getAvailableLicenses();

		if (availableLicenses.length === 0) {
			await info("No custom licenses available. Create one first.");
			return;
		}

		const selectedLicense = await vscode.window.showQuickPick(
			availableLicenses,
			{
				placeHolder: "Select a custom license to edit",
			}
		);

		if (selectedLicense) {
			await templateManager.handleTemplateEditing(selectedLicense);
		}
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown error occurred";
		await error(
			`Failed to edit custom license: ${errorMessage}`,
			err instanceof Error ? err : undefined
		);
	}
}

export async function selectDefaultLicenseCommand(
	licenseManager: LicenseManager,
	configService: ConfigService
): Promise<void> {
	try {
		const availableLicenses = await licenseManager.getAvailableLicenses();

		if (availableLicenses.length === 0) {
			await info("No licenses available. Create some licenses first.");
			return;
		}

		const selectedLicense = await vscode.window.showQuickPick(
			availableLicenses,
			{
				placeHolder: "Select your default license",
			}
		);

		if (selectedLicense) {
			const defaultTemplate = licenseManager.getDefaultLicense();
			await configService.updateDefaultLicense({
				name: selectedLicense as any,
				content: defaultTemplate.content,
			});
			await info(`Default license set to: ${selectedLicense}`);
		}
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown error occurred";
		await error(
			`Failed to select default license: ${errorMessage}`,
			err instanceof Error ? err : undefined
		);
	}
}
