import * as vscode from "vscode";
import error from "./error.ts";
import info from "./info.ts";

/**
 * Inserts a formatted license at the top of the current file and saves it.
 * @param formattedLicense License text with proper comment formatting
 * @returns True if successful, false otherwise
 */
export const insertLicenseIntoCurrentFile = async (
    formattedLicense: string
): Promise<boolean> => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        error("No active file to add license to");
        return false;
    }

    const { document } = editor;
    const insertPos = new vscode.Position(0, 0);
    const content = formattedLicense + "\n\n";

    const success = await editor.edit((editBuilder) =>
        editBuilder.insert(insertPos, content)
    );

    if (!success) {
        error("Failed to insert license into document");
        return false;
    }

    if (!(await document.save())) {
        error("Failed to save document after inserting license");
        return false;
    }

    info("License successfully added to file!");
    return true;
};
