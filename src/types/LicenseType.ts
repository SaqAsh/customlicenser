export const STANDARD_LICENSE_TYPES = [
  'mit',
  'apache',
  'gpl',
  'bsd',
  'isc',
  'mozilla',
] as const;

export type StandardLicenseType = (typeof STANDARD_LICENSE_TYPES)[number];

/**
 * Identifier of a license template. Either a built-in license name or
 * a user-defined custom template name. The `string & {}` intersection
 * preserves literal-string autocompletion for the standard values while
 * still accepting arbitrary identifiers.
 */
export type LicenseType = StandardLicenseType | (string & {});

const STANDARD_LICENSE_TYPE_SET: ReadonlySet<string> = new Set(
  STANDARD_LICENSE_TYPES,
);

export function isStandardLicenseType(
  value: string,
): value is StandardLicenseType {
  return STANDARD_LICENSE_TYPE_SET.has(value);
}
