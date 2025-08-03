import * as vscode from "vscode";

import { determineCommentType } from "../BackgroundUtilities/commentTypeManger";
import { checkIfLicenseExists } from "../BackgroundUtilities/licenseInserter";

import { fileTypeManger } from "../BackgroundUtilities/fileTypeManager";
import {
    blockFormatLicense,
    lineFormatLicense,
} from "../utils/licenseFormatters";
import error from "../utils/loggers/error";
import info from "../utils/loggers/info";
import warn from "../utils/loggers/warn";

/**
 * Prompts user for custom license text and adds it to the current file.
 * Handles custom license creation, validation, and formatting with appropriate
 * comment style for the current file's language.
 * @returns Promise resolving to true if successful, false otherwise
 */
export const addCustomLicense = async (): Promise<boolean> => {
    try {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            error("No active file to add license to");
            return false;
        }

        if (checkIfLicenseExists(editor.document) !== undefined) {
            const overwrite = await warn(
                "A license may already exist in this file. Do you want to add another one?",
                [{ title: "Yes" }, { title: "No" }]
            );
            if (overwrite?.title !== "Yes") {
                info("Custom license addition cancelled");
                return false;
            }
        }

        const customLicenseFile = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            openLabel: "Select Custom License File",
            filters: {
                "Text Files": ["txt", "md"],
                "All Files": ["*"],
            },
        });

        if (customLicenseFile === undefined) {
            error("Unable to get custom license text");
            return false;
        }

        const commentType = await determineCommentType();
        if (commentType === undefined) {
            error("Unable to determine comment type for this file");
            return false;
        }

        const languageId = fileTypeManger()?.languageID.toLowerCase() ?? "c";

        const formattedLicense =
            commentType.type === "line"
                ? lineFormatLicense(processedTemplate, languageId)
                : blockFormatLicense(processedTemplate, languageId);

        const success = await insertLicenseIntoCurrentFile(formattedLicense);
        return success;
    } catch (err) {
        if (err instanceof Error) {
            error("Failed to add custom license", err);
        }
        return false;
    }
};
