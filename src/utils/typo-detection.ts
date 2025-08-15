import levenshtein from "fastest-levenshtein";
export function typoDetector(
	defaultLicense: string,
	extractedLicense: string
): number {
	return levenshtein.distance(defaultLicense, extractedLicense);
}
