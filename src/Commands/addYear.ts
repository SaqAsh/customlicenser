import { displayInputBox } from "../utils/inputBox";
import { updatePreference } from "../utils/updatePreference";

const getYearFromUser = async () => {
    return displayInputBox({
        prompt: "Enter the year for the license",
        placeHolder: `${new Date()}`,
        value: new Date().getFullYear().toString(),
        validateInput: (value) => {
            return !value || isNaN(Number(value))
                ? "Please enter a valid year"
                : null;
        },
    });
};

const handleYear = async (year: string) => {
    return updatePreference("defaultYear", year);
};

/**
 * Prompts user for year input and saves to workspace configuration.
 * Used for license template variable substitution.
 * @returns Promise resolving to the entered year string or undefined if cancelled
 */
export const setYear = async (): Promise<string | undefined> => {
    const year: string | undefined = await getYearFromUser();

    if (year !== undefined) {
        await handleYear(year);
    }

    return year;
};
