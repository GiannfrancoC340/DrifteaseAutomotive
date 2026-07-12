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