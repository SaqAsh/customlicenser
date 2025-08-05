import * as vscode from "vscode";
import { error, info } from "../loggers";
import { LicenseManager } from "../managers";
import { ConfigService } from "../services";

export async function addYearCommand(
	configService: ConfigService
): Promise<void> {
	try {
		const year = await vscode.window.showInputBox({
			prompt: "Enter the year for license headers",
			placeHolder: new Date().getFullYear().toString(),
			value: new Date().getFullYear().toString(),
			ignoreFocusOut: true,
			validateInput: (value) => {
				const yearNum = parseInt(value);
				if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
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
			err instanceof Error ? err.message : "Unknown error occurred";
		await error(
			`Failed to update year: ${errorMessage}`,
			err instanceof Error ? err : undefined
		);
	}
}

export async function addNameCommand(
	configService: ConfigService
): Promise<void> {
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
			err instanceof Error ? err.message : "Unknown error occurred";
		await error(
			`Failed to update author name: ${errorMessage}`,
			err instanceof Error ? err : undefined
		);
	}
}

export async function toggleAutoSaveCommand(
	licenseManager: LicenseManager
): Promise<void> {
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
			err instanceof Error ? err.message : "Unknown error occurred";
		await error(
			`Failed to toggle auto-save: ${errorMessage}`,
			err instanceof Error ? err : undefined
		);
	}
}
