import { error, info } from "../loggers";
import { LicenseManager } from "../managers";
import { ConfigService } from "../services";
import { displayInputBox } from "../ui";

export async function addYearCommand(
	configService: ConfigService
): Promise<void> {
	const yearPromise = Promise.resolve(
		displayInputBox({
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
		})
	);

	const [year, yearError] = await tryCatch(yearPromise);

	if (yearError) {
		const e =
			yearError instanceof Error
				? yearError.message
				: "Unknown error occurred";

		error(
			`Failed to update year: ${e}`,
			yearError instanceof Error ? yearError : undefined
		);
	}
	if (year) {
		await configService.updateYear(year);
		await info(`Year updated to: ${year}`);
	}
}

export async function addNameCommand(
	configService: ConfigService
): Promise<void> {
	const namePromise = Promise.resolve(
		displayInputBox({
			prompt: "Enter your name for license headers",
			placeHolder: "Your Name",
			ignoreFocusOut: true,
			validateInput: (value) => {
				if (!value || value.trim().length === 0) {
					return "Name cannot be empty";
				}
				return null;
			},
		})
	);

	const [name, err] = await tryCatch(namePromise);

	if (err) {
		error(`Failed to update name: ${err.message}`, err);
	}

	if (name) {
		await configService.updateAuthorName(name);
		await info(`Author name set to: ${name}`);
	}
}

export async function toggleAutoSaveCommand(
	licenseManager: LicenseManager
): Promise<void> {
	if (licenseManager.isAutoSaveEnabled) {
		await licenseManager.disableAutoSave();
		info("Auto-save disabled");
	} else {
		const [_, enableError] = await licenseManager.enableAutoSave();

		if (enableError) {
			error(
				`Failed to enable auto-save: ${enableError.message}`,
				enableError
			);
			return;
		}

		info("Auto-save enabled");
	}
}

export async function toggleAutoCorrectCommand(
	licenseManager: LicenseManager
): Promise<void> {
	if (licenseManager.isAutoCorrectEnabled) {
		const [_, err] = await licenseManager.disableAutoCorrect();

		if (err) {
			error(`Failed to disable auto-correct: ${err.message}`, err);
			return;
		}

		info("Auto-correct disabled");
	} else {
		const [_, enableError] = await licenseManager.enableAutoCorrect();

		if (enableError) {
			error(
				`Failed to enable auto-correct: ${enableError.message}`,
				enableError
			);
			return;
		}

		info("Auto-correct enabled");
	}
}
