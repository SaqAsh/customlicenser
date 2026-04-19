import {distance} from 'fastest-levenshtein';

export function typoDetector(
  defaultLicense: string,
  extractedLicense: string,
): number {
  return distance(defaultLicense, extractedLicense);
}
