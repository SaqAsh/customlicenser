import { determineCommentType } from "../BackgroundUtilities/commentTypeManger";
import { fileTypeManger } from "../BackgroundUtilities/fileTypeManager";
import { insertLicenseIntoCurrentFile } from "../BackgroundUtilities/licenseInserter";
import { blockFormatLicense, lineFormatLicense } from "./licenseFormatters";
import error from "./loggers/error";

export const applyLicenseToCurrentFile = async (
    licenseText: string
): Promise<boolean> => {
    try {
        const commentType = await determineCommentType();
        if (commentType === undefined) {
            error("Unable to determine comment type for this file");
            return false;
        }

        const languageId = fileTypeManger()?.languageID.toLowerCase() ?? "c";

        const formattedLicense =
            commentType.type === "line"
                ? lineFormatLicense(licenseText, languageId)
                : blockFormatLicense(licenseText, languageId);

        return await insertLicenseIntoCurrentFile(formattedLicense);
    } catch (err) {
        error(
            "Failed to apply license to current file",
            err instanceof Error ? err : new Error(String(err))
        );
        return false;
    }
};
