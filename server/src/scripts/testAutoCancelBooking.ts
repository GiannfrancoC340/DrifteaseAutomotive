/**
 * MANUAL TEST SCRIPT — run from the server/ folder:
 *   npx tsx src/scripts/testAutoCancelBooking.ts
 *
 * Creates a real Stripe test-mode PaymentIntent + a Firestore booking doc
 * with status "pending" and a startDate in the past, then runs the
 * auto-cancel sweep once (no waiting for the hourly cron) and prints the
 * booking doc before/after so you can confirm it flipped to "cancelled"
 * and got refunded.
 *
 * This writes a real document to your "bookings" collection (with fake
 * renter info). Delete it manually from the Firebase console afterward,
 * or note its id (printed below) to clean it up via script.
 */
import '../config/firebase';
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';
import { cancelExpiredPendingBookings } from '../jobs/cancelExpiredBookings';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const db = getFirestore();

async function main() {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    console.error('Refusing to run: STRIPE_SECRET_KEY does not look like a test-mode key.');
    process.exit(1);
  }

  console.log('Creating test PaymentIntent ($50.00, test card)...');
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 5000,
    currency: 'usd',
    payment_method: 'pm_card_visa',
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
  });
  console.log(`  -> ${paymentIntent.id} (status: ${paymentIntent.status})`);

  const bookingRef = db.collection('bookings').doc();
  await bookingRef.set({
    renterId: 'test-renter-script',
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
    paymentIntentId: paymentIntent.id,
    status: 'pending',
    createdAt: new Date().toISOString(),
    agreedToTerms: true,
    licenseUploaded: true,
  });
  console.log(`Created test booking ${bookingRef.id} (status: pending, startDate: yesterday)`);

  console.log('\nRunning cancelExpiredPendingBookings() sweep...\n');
  await cancelExpiredPendingBookings();

  const after = await bookingRef.get();
  console.log('\nBooking doc after sweep:');
  console.log(after.data());
  console.log(`\nFirestore doc id: ${bookingRef.id} — delete it from the console when done.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test script failed:', err);
    process.exit(1);
  });
