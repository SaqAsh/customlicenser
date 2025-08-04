import { LicenseType } from "../types";

export const LicenseTemplatePaths: Record<LicenseType, string> = {
	mit: "src/license-templates/mit.txt",
	apache: "src/license-templates/apache.txt",
	gpl: "src/license-templates/gpl.txt",
	bsd: "src/license-templates/bsd.txt",
	isc: "src/license-templates/isc.txt",
	mozilla: "src/license-templates/mozilla.txt",
};
