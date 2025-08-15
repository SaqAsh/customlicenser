export function removeLicense(license: string) {
	return license.replace(/^# Enter your content below:\n\n/, "");
}
