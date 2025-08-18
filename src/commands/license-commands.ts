import { QuickPickItem } from "vscode";
import { error, info } from "../loggers";
import { LicenseManager } from "../managers";
import { displayQuickPick } from "../ui";

export async function selectLicenseCommand(
	licenseManager: LicenseManager
): Promise<void> {
	const [availableLicenses, err] = await licenseManager.availableLicenses();

	if (err) {
		error(`Failed to get available licenses: ${err.message}`, err);
		return;
	}

	if (availableLicenses.length === 0) {
		info("No licenses available. Create some licenses first.");
		return;
	}

	const quickPickItems: QuickPickItem[] = availableLicenses.map(
		(license) => ({
			label: license,
			description: `Add ${license} license to the current file`,
		})
	);

	const selectedLicense = await displayQuickPick(
		quickPickItems,
		"Select a license to add to the current file",
		false,
		false
	);

	if (selectedLicense) {
		const [success, err] = await licenseManager.addLicenseToFile(
			selectedLicense.label
		);

		if (err) {
			error(`Failed to add license: ${err.message}`, err);
		}

		if (success) {
			info(`${selectedLicense.label} license added successfully`);
		}
	}
}

export async function addMITLicenseCommand(
	licenseManager: LicenseManager
): Promise<void> {
	const [success, err] = await licenseManager.addLicenseToFile("mit");

	if (err) {
		await error(`Failed to add MIT license: ${err.message}`, err);
	}

	if (success) {
		await info("MIT license added successfully");
	}
}

export async function addGPLLicenseCommand(
	licenseManager: LicenseManager
): Promise<void> {
	const [success, err] = await licenseManager.addLicenseToFile("gpl");
	if (err) {
		await error(`Failed to add GPL license: ${err.message}`, err);
	}

	if (success) {
		await info("GPL license added successfully");
	}
}

export async function addApacheLicenseCommand(
	licenseManager: LicenseManager
): Promise<void> {
	const [success, err] = await licenseManager.addLicenseToFile("apache");

	if (err) {
		await error(`Failed to add Apache license: ${err.message}`, err);
	}

	if (success) {
		await info("Apache license added successfully");
	}
}

export async function addBSDLicenseCommand(
	licenseManager: LicenseManager
): Promise<void> {
	const [success, err] = await licenseManager.addLicenseToFile("bsd");

	if (err) {
		await error(`Failed to add BSD license: ${err.message}`, err);
	}

	if (success) {
		await info("BSD license added successfully");
	}
}

export async function addISCLicenseCommand(
	licenseManager: LicenseManager
): Promise<void> {
	const [success, err] = await licenseManager.addLicenseToFile("isc");
	if (err) {
		await error(`Failed to add ISC license: ${err.message}`, err);
	}
	if (success) {
		await info("ISC license added successfully");
	}
}

export async function addMozillaLicenseCommand(
	licenseManager: LicenseManager
): Promise<void> {
	const [success, err] = await licenseManager.addLicenseToFile("mozilla");
	if (err) {
		await error(`Failed to add Mozilla license: ${err.message}`, err);
	}
	if (success) {
		await info("Mozilla license added successfully");
	}
}
