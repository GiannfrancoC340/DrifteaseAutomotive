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

export interface StateLicenseFormat {
  // Longest total character count among that state's valid formats - used
  // to cap live input length.
  length: number;
  // Regex (against the stripped, uppercased number) matching any of that
  // state's valid formats. Source: https://ntsi.com/drivers-license-format/
  pattern: RegExp;
  // Human-readable description of the valid format(s), for error messages.
  description: string;
  // Dash-separated group lengths, e.g. FL's [4, 3, 2, 1, 3] -> "C716-767-22-1-102".
  // Only set where the grouping is a known, confirmed display convention;
  // otherwise the number is shown as one ungrouped block of `length`.
  groups?: number[];
}

// Each state's valid driver's license number format(s), per
// https://ntsi.com/drivers-license-format/. Some states have several valid
// formats (current + legacy); `pattern` accepts any of them.
export const STATE_LICENSE_FORMATS: Record<string, StateLicenseFormat> = {
  AL: { length: 8, pattern: /^[0-9]{1,8}$/, description: "1-8 digits" },
  AK: { length: 7, pattern: /^[0-9]{1,7}$/, description: "1-7 digits" },
  AZ: {
    length: 9,
    pattern: /^(?:[A-Z][0-9]{1,8}|[A-Z]{2}[0-9]{2,5}|[0-9]{9})$/,
    description: "1 letter + 1-8 digits, 2 letters + 2-5 digits, or 9 digits",
  },
  AR: { length: 9, pattern: /^[0-9]{4,9}$/, description: "4-9 digits" },
  CA: { length: 8, pattern: /^[A-Z][0-9]{7}$/, description: "1 letter + 7 digits" },
  CO: {
    length: 9,
    pattern: /^(?:[0-9]{9}|[A-Z][0-9]{3,6}|[A-Z]{2}[0-9]{2,5})$/,
    description: "9 digits, 1 letter + 3-6 digits, or 2 letters + 2-5 digits",
  },
  CT: { length: 9, pattern: /^[0-9]{9}$/, description: "9 digits" },
  DE: { length: 7, pattern: /^[0-9]{1,7}$/, description: "1-7 digits" },
  DC: { length: 9, pattern: /^(?:[0-9]{7}|[0-9]{9})$/, description: "7 or 9 digits" },
  FL: {
    length: 13,
    groups: [4, 3, 2, 1, 3],
    pattern: /^[A-Z][0-9]{12}$/,
    description: "1 letter + 12 digits",
  },
  GA: { length: 9, pattern: /^[0-9]{7,9}$/, description: "7-9 digits" },
  HI: {
    length: 9,
    pattern: /^(?:[A-Z][0-9]{8}|[0-9]{9})$/,
    description: "1 letter + 8 digits, or 9 digits",
  },
  ID: {
    length: 9,
    pattern: /^(?:[A-Z]{2}[0-9]{6}[A-Z]|[0-9]{9})$/,
    description: "2 letters + 6 digits + 1 letter, or 9 digits",
  },
  IL: { length: 13, pattern: /^[A-Z][0-9]{11,12}$/, description: "1 letter + 11-12 digits" },
  IN: {
    length: 10,
    pattern: /^(?:[A-Z][0-9]{9}|[0-9]{9,10})$/,
    description: "1 letter + 9 digits, or 9-10 digits",
  },
  IA: {
    length: 9,
    pattern: /^(?:[0-9]{9}|[0-9]{3}[A-Z]{2}[0-9]{4})$/,
    description: "9 digits, or 3 digits + 2 letters + 4 digits",
  },
  KS: {
    length: 9,
    pattern: /^(?:[A-Z][0-9][A-Z][0-9][A-Z]|[A-Z][0-9]{8}|[0-9]{9})$/,
    description: "1 letter + 8 digits, 9 digits, or alternating letter/digit/letter/digit/letter",
  },
  KY: {
    length: 10,
    pattern: /^(?:[A-Z][0-9]{8,9}|[0-9]{9})$/,
    description: "1 letter + 8-9 digits, or 9 digits",
  },
  LA: { length: 9, pattern: /^[0-9]{1,9}$/, description: "1-9 digits" },
  ME: {
    length: 8,
    pattern: /^(?:[0-9]{7,8}|[0-9]{7}[A-Z])$/,
    description: "7-8 digits, or 7 digits + 1 letter",
  },
  MD: {
    length: 13,
    pattern: /^(?:[A-Z][0-9]{12}|MD[0-9]{11})$/,
    description: "1 letter + 12 digits",
  },
  MA: {
    length: 9,
    pattern: /^(?:[A-Z][0-9]{8}|[A-Z]{2}[0-9]{7}|[0-9]{9})$/,
    description: "1 letter + 8 digits, 2 letters + 7 digits, or 9 digits",
  },
  MI: {
    length: 13,
    pattern: /^[A-Z](?:[0-9]{10}|[0-9]{12})$/,
    description: "1 letter + 10 digits, or 1 letter + 12 digits",
  },
  MN: { length: 13, pattern: /^[A-Z][0-9]{12}$/, description: "1 letter + 12 digits" },
  MS: { length: 9, pattern: /^[0-9]{9}$/, description: "9 digits" },
  MO: {
    length: 10,
    pattern: /^(?:[A-Z][0-9]{5,9}|[A-Z][0-9]{6}R|[0-9]{3}[A-Z][0-9]{6}|[0-9]{8}[A-Z]{2}|[0-9]{9}[A-Z]|[0-9]{9})$/,
    description: "1 letter + 5-9 digits, 9 digits, or several other legacy formats",
  },
  MT: {
    length: 14,
    pattern: /^(?:[A-Z][0-9]{8}|[0-9]{13}|[0-9]{9}|[0-9]{14}|[A-Z]{3}[0-9]{10})$/,
    description: "1 letter + 8 digits, 9, 13, or 14 digits, or 3 letters + 10 digits",
  },
  NE: {
    length: 9,
    pattern: /^(?:[0-9]{1,7}|[A-Z][0-9]{6,8})$/,
    description: "1-7 digits, or 1 letter + 6-8 digits",
  },
  NV: {
    length: 12,
    pattern: /^(?:[0-9]{9,10}|[0-9]{12}|X[0-9]{8})$/,
    description: "9-10 digits, 12 digits, or 'X' + 8 digits",
  },
  NH: {
    length: 11,
    pattern: /^(?:[0-9]{2}[A-Z]{3}[0-9]{5}|[A-Z]{3}[0-9]{8})$/,
    description: "2 digits + 3 letters + 5 digits, or 3 letters + 8 digits",
  },
  NJ: { length: 15, pattern: /^[A-Z][0-9]{14}$/, description: "1 letter + 14 digits" },
  NM: { length: 9, pattern: /^[0-9]{8,9}$/, description: "8-9 digits" },
  NY: {
    length: 19,
    pattern: /^(?:[A-Z][0-9]{7}|[A-Z][0-9]{18}|[0-9]{8}|[0-9]{9}|[0-9]{16}|[A-Z]{8})$/,
    description: "9 digits (or one of several legacy formats)",
  },
  NC: { length: 12, pattern: /^[0-9]{1,12}$/, description: "1-12 digits" },
  ND: {
    length: 9,
    pattern: /^(?:[A-Z]{3}[0-9]{6}|[0-9]{9})$/,
    description: "3 letters + 6 digits, or 9 digits",
  },
  OH: {
    length: 9,
    pattern: /^(?:[A-Z][0-9]{4,8}|[A-Z]{2}[0-9]{3,7}|[0-9]{8})$/,
    description: "1 letter + 4-8 digits, 2 letters + 3-7 digits, or 8 digits",
  },
  OK: {
    length: 10,
    pattern: /^(?:[A-Z][0-9]{9}|[0-9]{9})$/,
    description: "1 letter + 9 digits, or 9 digits",
  },
  OR: {
    length: 9,
    pattern: /^(?:[0-9]{1,9}|[A-Z][0-9]{6,7})$/,
    description: "1-9 digits, or 1 letter + 6-7 digits",
  },
  PA: { length: 8, pattern: /^[0-9]{8}$/, description: "8 digits" },
  RI: {
    length: 8,
    pattern: /^(?:[0-9]{7,8}|[A-Z][0-9]{6})$/,
    description: "7-8 digits, or 1 letter + 6 digits",
  },
  SC: { length: 11, pattern: /^[0-9]{5,11}$/, description: "5-11 digits" },
  SD: {
    length: 12,
    pattern: /^(?:[0-9]{6,10}|[0-9]{12})$/,
    description: "6-10 digits, or 12 digits",
  },
  TN: { length: 9, pattern: /^[0-9]{7,9}$/, description: "7-9 digits" },
  TX: { length: 8, pattern: /^[0-9]{7,8}$/, description: "7-8 digits" },
  UT: { length: 10, pattern: /^[0-9]{4,10}$/, description: "4-10 digits" },
  VT: {
    length: 8,
    pattern: /^(?:[0-9]{8}|[0-9]{7}A)$/,
    description: "8 digits, or 7 digits + 'A'",
  },
  VA: {
    length: 12,
    pattern: /^(?:[A-Z][0-9]{8,11}|[0-9]{9})$/,
    description: "1 letter + 8-11 digits, or 9 digits",
  },
  WA: {
    length: 12,
    pattern: /^(?=.{12}$)[A-Z]{1,7}[A-Z0-9*]{4,11}$/,
    description: "12 characters: 1-7 letters followed by letters/digits/*",
  },
  WV: {
    length: 8,
    pattern: /^(?:[0-9]{7}|[A-Z]{1,2}[0-9]{5,6})$/,
    description: "7 digits, or 1-2 letters + 5-6 digits",
  },
  WI: { length: 14, pattern: /^[A-Z][0-9]{13}$/, description: "1 letter + 13 digits" },
  WY: { length: 10, pattern: /^[0-9]{9,10}$/, description: "9-10 digits" },
};

export const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export function getLicenseFormat(stateCode: string): StateLicenseFormat | undefined {
  return STATE_LICENSE_FORMATS[stateCode];
}

// Checked at save time, not on every keystroke - a state with an unmatched
// code (blank, territory, typo) skips validation entirely.
export function isValidLicenseNumberForState(licenseNumber: string, stateCode: string): boolean {
  const format = getLicenseFormat(stateCode);
  if (!format) return true;
  const stripped = licenseNumber.toUpperCase().replace(/[^A-Z0-9*]/g, "");
  return format.pattern.test(stripped);
}

// Formatted-input max length includes the dashes inserted between groups.
export function getLicenseInputMaxLength(format: StateLicenseFormat | undefined): number | undefined {
  if (!format) return undefined;
  const groups = format.groups ?? [format.length];
  return format.length + groups.length - 1;
}

export function formatDriversLicenseNumber(
  rawInput: string,
  previousFormatted: string,
  stateCode: string
): string {
  const format = getLicenseFormat(stateCode);
  if (!format) return rawInput;

  let stripped = rawInput.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // If the user backspaced over an auto-inserted dash, the stripped value
  // won't have shrunk even though the visible input did - drop one more
  // character so backspace always removes something.
  const previousStripped = previousFormatted.replace(/[^A-Z0-9]/g, "");
  if (rawInput.length < previousFormatted.length && stripped.length === previousStripped.length) {
    stripped = stripped.slice(0, -1);
  }

  stripped = stripped.slice(0, format.length);

  const groups = format.groups ?? [format.length];
  const segments: string[] = [];
  let idx = 0;
  for (const len of groups) {
    if (idx >= stripped.length) break;
    segments.push(stripped.slice(idx, idx + len));
    idx += len;
  }
  return segments.join("-");
}