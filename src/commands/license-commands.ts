import * as vscode from "vscode";
import { error, info, warn } from "../loggers";
import { LicenseManager } from "../managers";

export async function selectLicenseCommand(
	licenseManager: LicenseManager
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
				placeHolder: "Select a license to add to the current file",
			}
		);

		if (selectedLicense) {
			const success = await licenseManager.addLicenseToFile(
				selectedLicense as any
			);
			if (success) {
				await info(`${selectedLicense} license added successfully`);
			} else {
				await warn("License addition was cancelled or failed");
			}
		}
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown error occurred";
		await error(
			`Failed to add license: ${errorMessage}`,
			err instanceof Error ? err : undefined
		);
	}
}

export async function addMITLicenseCommand(
	licenseManager: LicenseManager
): Promise<void> {
	try {
		console.log("Extension: addMITLicense command called");
		const success = await licenseManager.addLicenseToFile("mit");
		if (success) {
			await info("MIT license added successfully");
		} else {
			await warn("MIT license addition was cancelled or failed");
		}
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown error occurred";
		await error(
			`Failed to add MIT license: ${errorMessage}`,
			err instanceof Error ? err : undefined
		);
	}
}

export async function addGPLLicenseCommand(
	licenseManager: LicenseManager
): Promise<void> {
	try {
		const success = await licenseManager.addLicenseToFile("gpl");
		if (success) {
			await info("GPL license added successfully");
		} else {
			await warn("GPL license addition was cancelled or failed");
		}
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown error occurred";
		await error(
			`Failed to add GPL license: ${errorMessage}`,
			err instanceof Error ? err : undefined
		);
	}
}

export async function addApacheLicenseCommand(
	licenseManager: LicenseManager
): Promise<void> {
	try {
		const success = await licenseManager.addLicenseToFile("apache");
		if (success) {
			await info("Apache license added successfully");
		} else {
			await warn("Apache license addition was cancelled or failed");
		}
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown error occurred";
		await error(
			`Failed to add Apache license: ${errorMessage}`,
			err instanceof Error ? err : undefined
		);
	}
}

export async function addBSDLicenseCommand(
	licenseManager: LicenseManager
): Promise<void> {
	try {
		const success = await licenseManager.addLicenseToFile("bsd");
		if (success) {
			await info("BSD license added successfully");
		} else {
			await warn("BSD license addition was cancelled or failed");
		}
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown error occurred";
		await error(
			`Failed to add BSD license: ${errorMessage}`,
			err instanceof Error ? err : undefined
		);
	}
}

export async function addISCLicenseCommand(
	licenseManager: LicenseManager
): Promise<void> {
	try {
		const success = await licenseManager.addLicenseToFile("isc");
		if (success) {
			await info("ISC license added successfully");
		} else {
			await warn("ISC license addition was cancelled or failed");
		}
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown error occurred";
		await error(
			`Failed to add ISC license: ${errorMessage}`,
			err instanceof Error ? err : undefined
		);
	}
}

export async function addMozillaLicenseCommand(
	licenseManager: LicenseManager
): Promise<void> {
	try {
		const success = await licenseManager.addLicenseToFile("mozilla");
		if (success) {
			await info("Mozilla license added successfully");
		} else {
			await warn("Mozilla license addition was cancelled or failed");
		}
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown error occurred";
		await error(
			`Failed to add Mozilla license: ${errorMessage}`,
			err instanceof Error ? err : undefined
		);
	}
}
