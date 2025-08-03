import error from "../utils/loggers/error";
import info from "../utils/loggers/info";
import { displayQuickPick } from "../utils/quickPick";
import { updatePreference } from "../utils/updatePreference";

export type autoSaveOptions = {
    label: string;
};

/**
 * Toggles the auto-add license on save functionality.
 * Shows confirmation dialog and updates workspace configuration.
 * Enables/disables automatic license insertion when files are saved.
 * @returns Promise resolving to current state (true=enabled, false=disabled, undefined=error)
 */
const setAutoAddOnSavePreference = async (
    userPreference: boolean
): Promise<void> => {
    updatePreference(userPreference, "autoAddOnSave");
};

/**
 * Configures the auto-add license on save functionality.
 * Prompts the user to enable or disable the feature, updates settings accordingly,
 * and returns the new state.
 * @returns Promise resolving to the selected state (true = enabled, false = disabled, undefined = cancelled or error)
 */
export const configureAutoAddOnSave = async (): Promise<
    boolean | undefined
> => {
    try {
        const selection = await displayQuickPick<autoSaveOptions>(
            [{ label: "Enable" }, { label: "Disable" }],
            "Enable or Disable auto add license",
            false,
            true
        );

        if (selection === undefined) {
            info("Auto-add on save configuration cancelled");
            return;
        }

        const preference = selection?.label === "Enable";
        await setAutoAddOnSavePreference(preference);

        return preference;
    } catch (err) {
        if (err instanceof Error) {
            error("Error updating auto-add on save setting: ", err);
        }
        return undefined;
    }
};
