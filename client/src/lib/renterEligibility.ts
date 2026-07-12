export const MIN_RENTAL_AGE = 18;

export function calculateAge(dobString: string): number {
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function isUnderMinimumAge(dobString: string): boolean {
  return calculateAge(dobString) < MIN_RENTAL_AGE;
}

// License must still be valid through the return date, not just today -
// a renter shouldn't be able to book a trip that outlasts their license.
export function isLicenseExpiredBy(licenseExpiration: string, byDate: Date): boolean {
  const expiration = new Date(licenseExpiration);
  return expiration < byDate;
}

export function maskLicenseNumber(licenseNumber: string): string {
  if (licenseNumber.length <= 4) return licenseNumber;
  const last4 = licenseNumber.slice(-4);
  return "•".repeat(licenseNumber.length - 4) + last4;
}

// License number groups: 1 letter + 3 digits, then 3, 2, 1, 3 digits -
// e.g. "C716-767-22-1-102". Applied live as the user types, mirroring
// the format on a physical FL license.
const LICENSE_SEGMENT_LENGTHS = [4, 3, 2, 1, 3];
const LICENSE_MAX_RAW_LENGTH = LICENSE_SEGMENT_LENGTHS.reduce((a, b) => a + b, 0);

export function formatDriversLicenseNumber(rawInput: string, previousFormatted: string): string {
  let stripped = rawInput.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // If the user backspaced over an auto-inserted dash, the stripped value
  // won't have shrunk even though the visible input did - drop one more
  // character so backspace always removes something.
  const previousStripped = previousFormatted.replace(/[^A-Z0-9]/g, "");
  if (rawInput.length < previousFormatted.length && stripped.length === previousStripped.length) {
    stripped = stripped.slice(0, -1);
  }

  stripped = stripped.slice(0, LICENSE_MAX_RAW_LENGTH);

  const segments: string[] = [];
  let idx = 0;
  for (const len of LICENSE_SEGMENT_LENGTHS) {
    if (idx >= stripped.length) break;
    segments.push(stripped.slice(idx, idx + len));
    idx += len;
  }
  return segments.join("-");
}