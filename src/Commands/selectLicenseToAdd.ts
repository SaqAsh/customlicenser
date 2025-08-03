import { displayQuickPick } from "../utils/quickPick";

export type LicenseType =
    | "MIT"
    | "Apache"
    | "GPL"
    | "BSD"
    | "ISC"
    | "Mozilla"
    | "Custom";

export type LicenseOption = {
    label: string;
    description: string;
    type: LicenseType;
    filename?: string;
};

/**
 * Gets the list of available license options for selection.
 * @returns Array of license options with labels, descriptions, and metadata
 */
export const getLicenseOptions = (): LicenseOption[] => {
    return [
        {
            label: "MIT License",
            description: "A short and simple permissive license",
            type: "MIT",
            filename: "MIT.txt",
        },
        {
            label: "Apache License 2.0",
            description: "A permissive license with patent protection",
            type: "Apache",
            filename: "Apache.txt",
        },
        {
            label: "GNU General Public License v3.0",
            description: "Strong copyleft license",
            type: "GPL",
            filename: "GPL.txt",
        },
        {
            label: "BSD 3-Clause License",
            description: "A permissive license similar to MIT",
            type: "BSD",
            filename: "BSD.txt",
        },
        {
            label: "ISC License",
            description: "A simplified version of the MIT license",
            type: "ISC",
            filename: "ISC.txt",
        },
        {
            label: "Mozilla Public License 2.0",
            description: "Weak copyleft license",
            type: "Mozilla",
            filename: "Mozilla.txt",
        },
        {
            label: "Custom License",
            description: "Add your own custom license text",
            type: "Custom",
        },
    ];
};

/**
 * Shows a quick pick dialog for license selection.
 * Displays all available licenses (standard and custom) for user selection.
 * @returns Promise resolving to selected license option or undefined if cancelled
 */
export const selectLicenseToAdd = async (): Promise<
    LicenseOption | undefined
> => {
    return await displayQuickPick(
        getLicenseOptions(),
        "Select a license to add to your file",
        true,
        true
    );
};
