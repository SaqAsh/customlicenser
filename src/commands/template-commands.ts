import { error, info } from "../loggers";
import { LicenseManager, TemplateManager } from "../managers";
import { ConfigService } from "../services";
import { ITemplateService } from "../services/interfaces";
import { displayInputBox, displayQuickPick } from "../ui";

export async function createCustomLicenseCommand(
	templateManager: TemplateManager
): Promise<void> {
	const templateNamePromise = Promise.resolve(
		displayInputBox({
			prompt: "Enter a name for your custom license template",
			placeHolder: "My Custom License",
			ignoreFocusOut: true,
			validateInput: (value) => {
				if (!value || value.trim().length === 0) {
					return "Template name cannot be empty";
				}
				return null;
			},
		})
	);

	const [templateName, err] = await tryCatch(templateNamePromise);

	if (err) {
		await error(`Failed to create custom license: ${err.message}`, err);
	}
	if (templateName) {
		//TODO: Implement template creation logic
		await templateManager.handleTemplateCreation(templateName as any);
	}
}

export async function editCustomLicenseCommand(
	licenseManager: LicenseManager,
	templateManager: TemplateManager
): Promise<void> {
	const [availableLicenses, err] = await licenseManager.availableLicenses();

	if (err) {
		await error(`Failed to get available licenses: ${err.message}`, err);
		return;
	}

	if (availableLicenses.length === 0) {
		await info("No custom licenses available. Create one first.");
		return;
	}

	const quickPickItems = availableLicenses.map((license) => ({
		label: license,
		description: `Add ${license} license to the current file`,
	}));

	const selectedLicense = await displayQuickPick(
		quickPickItems,
		"Select a custom license to edit",
		false,
		false
	);

	if (selectedLicense) {
		await templateManager.handleTemplateEditing(
			selectedLicense.description
		);
	}
}

export async function selectDefaultLicenseCommand(
	licenseManager: LicenseManager,
	configService: ConfigService,
	templateService: ITemplateService
): Promise<void> {
	const [availableLicenses, err] = await licenseManager.availableLicenses();

	if (err) {
		await error(`Failed to get available licenses: ${err.message}`, err);
		return;
	}

	if (availableLicenses.length === 0) {
		await info("No licenses available. Create some licenses first.");
		return;
	}

	const quickPickItems = availableLicenses.map((license) => ({
		label: license,
		description: `Set ${license} as default license`,
	}));

	const selectedLicense = await displayQuickPick(
		quickPickItems,
		"Select a default license",
		false,
		false
	);

	if (selectedLicense) {
		// Fetch the actual template for the selected license
		const [template, templateError] = await templateService.getTemplate(
			selectedLicense.label
		);

		if (templateError) {
			await error(
				`Failed to get template for ${selectedLicense.label}: ${templateError.message}`,
				templateError
			);
			return;
		}

		// Update the default license with the full template
		await configService.updateDefaultLicense(template);
		await info(`Default license set to: ${selectedLicense.label}`);
	}
}
