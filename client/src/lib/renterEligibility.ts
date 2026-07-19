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
  // Total character count of that state's current standard license number.
  length: number;
  // Dash-separated group lengths, e.g. FL's [4, 3, 2, 1, 3] -> "C716-767-22-1-102".
  // Only set where the grouping is a known, confirmed display convention;
  // otherwise the number is shown as one ungrouped block of `length`.
  groups?: number[];
}

// Max length of each state's current standard driver's license number
// format (most common issuance pattern - older/legacy numbers still on file
// may run shorter, so this caps input length rather than requiring an exact
// match). Territories and unrecognized codes fall back to freeform text.
export const STATE_LICENSE_FORMATS: Record<string, StateLicenseFormat> = {
  AL: { length: 8 },
  AK: { length: 7 },
  AZ: { length: 9 },
  AR: { length: 9 },
  CA: { length: 8 },
  CO: { length: 9 },
  CT: { length: 9 },
  DE: { length: 7 },
  DC: { length: 9 },
  FL: { length: 13, groups: [4, 3, 2, 1, 3] },
  GA: { length: 9 },
  HI: { length: 9 },
  ID: { length: 9 },
  IL: { length: 12 },
  IN: { length: 10 },
  IA: { length: 9 },
  KS: { length: 9 },
  KY: { length: 10 },
  LA: { length: 9 },
  ME: { length: 7 },
  MD: { length: 13 },
  MA: { length: 9 },
  MI: { length: 13 },
  MN: { length: 13 },
  MS: { length: 9 },
  MO: { length: 9 },
  MT: { length: 9 },
  NE: { length: 8 },
  NV: { length: 10 },
  NH: { length: 10 },
  NJ: { length: 15 },
  NM: { length: 9 },
  NY: { length: 9 },
  NC: { length: 12 },
  ND: { length: 9 },
  OH: { length: 8 },
  OK: { length: 10 },
  OR: { length: 9 },
  PA: { length: 8 },
  RI: { length: 7 },
  SC: { length: 11 },
  SD: { length: 10 },
  TN: { length: 9 },
  TX: { length: 8 },
  UT: { length: 10 },
  VT: { length: 8 },
  VA: { length: 9 },
  WA: { length: 12 },
  WV: { length: 7 },
  WI: { length: 14 },
  WY: { length: 10 },
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