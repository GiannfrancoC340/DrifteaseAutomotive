/**
 * MANUAL TEST SCRIPT — run from the server/ folder:
 *   npx tsx src/scripts/testAutoCancelRefundFailure.ts
 *
 * Creates a Firestore booking doc with status "pending", a startDate in the
 * past, and a bogus paymentIntentId (no real Stripe PaymentIntent behind
 * it), then runs the auto-cancel sweep once. Confirms the doc still flips
 * to "cancelled" but refundStatus ends up "failed" with a refundError,
 * i.e. cancellation is not rolled back when the refund call errors.
 *
 * Writes a real doc to your "bookings" collection. Delete it manually
 * from the Firebase console afterward.
 */
import '../config/firebase';
import { getFirestore } from 'firebase-admin/firestore';
import { cancelExpiredPendingBookings } from '../jobs/cancelExpiredBookings';

const db = getFirestore();

async function main() {
  const bookingRef = db.collection('bookings').doc();
  await bookingRef.set({
    renterId: 'test-renter-refund-failure',
    renterEmail: 'test@example.com',
    renterName: 'Test Username',
    vehicleId: 'car1',
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
    endDate: new Date().toISOString(),
    totalPrice: 50,
    amountPaid: 50,
    remainingAmount: 0,
    paymentOption: 'full',
    depositPercent: 100,
    paymentIntentId: 'pi_does_not_exist_12345', // bogus - Stripe will reject this
    status: 'pending',
    createdAt: new Date().toISOString(),
    agreedToTerms: true,
    licenseUploaded: true,
  });
  console.log(`Created test booking ${bookingRef.id} (status: pending, bogus paymentIntentId)`);

  console.log('\nRunning cancelExpiredPendingBookings() sweep...\n');
  await cancelExpiredPendingBookings();

  const after = await bookingRef.get();
  console.log('\nBooking doc after sweep:');
  console.log(after.data());

  const data = after.data();
  const ok = data?.status === 'cancelled' && data?.refundStatus === 'failed' && !!data?.refundError;
  console.log(`\n${ok ? 'PASS' : 'FAIL'}: status=${data?.status}, refundStatus=${data?.refundStatus}`);

  console.log(`\nFirestore doc id: ${bookingRef.id} — delete it from the console when done.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test script failed:', err);
    process.exit(1);
  });
