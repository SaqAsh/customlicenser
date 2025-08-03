import {
	getLicenseOptions,
	LicenseOption,
} from "../utils/getLicenseOptions.ts";
import { displayQuickPick } from "../utils/quickPick.ts";

/**
 * Displays a quick pick dialog to select a license to add.
 * @returns Promise resolving to selected license option or undefined if cancelled
 */
export const selectLicenseToAdd = async (): Promise<
	LicenseOption | undefined
> => {
	return await displayQuickPick(
		getLicenseOptions(),
		"Select a license to add to your file",
		false,
		true
	);
};
