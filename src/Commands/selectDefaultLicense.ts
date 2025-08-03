import { getCurrConfigVal } from "../utils/getCurrConfigVal";
import error from "../utils/loggers/error";
import info from "../utils/loggers/info";
import { displayQuickPick } from "../utils/quickPick";
import { updatePreference } from "../utils/updatePreference";
import { getLicenseOptions } from "./selectLicenseToAdd";

/**
 * Shows license selection dialog for setting workspace default.
 * Allows user to select a default license type for auto-insertion.
 * Saves selection to workspace configuration.
 * @returns Promise resolving to true if default was set, false if cancelled
 */
export const selectDefaultLicense = async (): Promise<boolean> => {
	try {
		const selected = await displayQuickPick(
			getLicenseOptions(),
			"Select a default license",
			false,
			true,
			true
		);

		if (selected === undefined) {
			info(`Failed to set default license: No selection made`);
			return false;
		}

		await updatePreference(selected.type, "defaultLicense");

		info(`Default license set to: ${selected.label}`);

		return true;
	} catch (err) {
		if (err instanceof Error) {
			error("Failed to set default license: ${err.message}", err);
		} else {
			error(`Failed to set default license: Unknown error`);
		}
		return false;
	}
};

/**
 * Gets the currently set default license type.
 * @returns The default license type string or undefined if not set
 */
export const getDefaultLicense = (): string | undefined => {
	return getCurrConfigVal("defaultLicense");
};
