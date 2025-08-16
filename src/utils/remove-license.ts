import * as vscode from "vscode";

import { ExtractedLicense } from "../types/ExtractedLicense";

export function removeLicense(
	extractedLicenseInformation: ExtractedLicense,
	defaultLicense: string
) {
	const { startingLine, endingLine } = extractedLicenseInformation;

	const licenseEdit = vscode.TextEdit.replace(
		new vscode.Range(
			new vscode.Position(startingLine, 0),
			new vscode.Position(endingLine + 1, 0)
		),
		defaultLicense + "\n\n"
	);

	return licenseEdit;
}
