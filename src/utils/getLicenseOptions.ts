import { standardLicenses } from "../constants/StandardLicenses";
import { LicenseType } from "../types/LicenseType";
import { getCurrConfigVal } from "./getCurrConfigVal";
import { truncateContent } from "./truncateContent";

export type LicenseOption = {
    label: string;
    description: string;
    type: LicenseType;
    filename?: string;
    customId?: string;
    customContent?: string;
};

export interface CustomLicense {
    name: string;
    content: string;
    id: string;
}
/**
 * Gets the list of available license options for selection, including saved custom licenses.
 * @returns Array of license options with labels, descriptions, and metadata
 */
export const getLicenseOptions = (): LicenseOption[] => {
    const customLicenses = getCurrConfigVal<CustomLicense[]>("customLicenses");
    const savedCustomLicenseOptions: LicenseOption[] | undefined =
        customLicenses?.map((license) => ({
            label: `[Custom] ${license.name}`,
            description: truncateContent(license.content),
            type: "SavedCustom",
            customId: license.id,
            customContent: license.content,
        }));

    if (savedCustomLicenseOptions === undefined) {
        return standardLicenses;
    }

    return [...standardLicenses, ...savedCustomLicenseOptions];
};
