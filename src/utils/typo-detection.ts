import levenshtein from "fast-levenshtein";
export function typoDetector(
	defaultLicense: string,
	extractedLicense: string
): number {
	return levenshtein.get(defaultLicense, extractedLicense);
}
