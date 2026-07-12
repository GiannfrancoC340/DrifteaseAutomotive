/**
 * ONE-TIME SCRIPT — run manually from the server/ folder:
 *   npx tsx src/scripts/setAdmin.ts <uid>
 *
 * This is NOT part of the running app. It's a standalone script to grant
 * the admin custom claim to a specific user. Run it once per new admin.
 *
 * You can find a user's uid in Firebase Console → Authentication → Users,
 * or in Firestore under users/{uid}.
 */
import '../config/firebase'; // reuses your existing Firebase Admin init
import { getAuth } from 'firebase-admin/auth';

const uid = process.argv[2];

if (!uid) {
  console.error('Usage: npx ts-node scripts/setAdmin.ts <uid>');
  process.exit(1);
}

async function main() {
  await getAuth().setCustomUserClaims(uid, { admin: true });
  console.log(`Admin claim set for uid: ${uid}`);
  console.log('Note: the user must log out and back in (or force-refresh their ID token) for this to take effect client-side.');
}

main().catch((err) => {
  console.error('Failed to set admin claim:', err);
  process.exit(1);
});