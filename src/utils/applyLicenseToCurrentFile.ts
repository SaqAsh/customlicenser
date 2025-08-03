import { determineCommentType } from "../BackgroundUtilities/commentTypeManger.ts";
import { fileTypeManger } from "../BackgroundUtilities/fileTypeManager.ts";
import { insertLicenseIntoCurrentFile } from "../BackgroundUtilities/insert-license-into-current-file.ts";
import { blockFormatLicense, lineFormatLicense } from "./licenseFormatters.ts";
import error from "./loggers/error.ts";

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
