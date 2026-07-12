import Stripe from 'stripe';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import cron from 'node-cron';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const db = getFirestore();

interface PendingBookingDoc {
  status: string;
  startDate: string;
  amountPaid?: number;
  paymentIntentId?: string;
}

const CANCELLATION_REASON = 'auto_expired_no_approval';

export async function cancelExpiredPendingBookings(): Promise<void> {
  const nowIso = new Date().toISOString();
  console.log(`[cancelExpiredBookings] sweep starting, cutoff=${nowIso}`);

  let snap;
  try {
    snap = await db
      .collection('bookings')
      .where('status', '==', 'pending')
      .where('startDate', '<=', nowIso)
      .get();
  } catch (err) {
    console.error('[cancelExpiredBookings] Firestore query failed:', err);
    return;
  }

  if (snap.empty) {
    console.log('[cancelExpiredBookings] no expired pending bookings found');
    return;
  }
  console.log(`[cancelExpiredBookings] found ${snap.size} candidate(s)`);

  for (const docSnap of snap.docs) {
    await processOneBooking(docSnap.id, docSnap.data() as PendingBookingDoc);
  }
}

async function processOneBooking(bookingId: string, data: PendingBookingDoc): Promise<void> {
  const bookingRef = db.collection('bookings').doc(bookingId);

  if (Number.isNaN(Date.parse(data.startDate))) {
    console.warn(`[cancelExpiredBookings] ${bookingId}: unparseable startDate, skipping`);
    return;
  }

  // Atomic claim: re-read + re-check status inside a transaction so a
  // concurrent sweep tick or a human approving/cancelling via the admin
  // UI can't race us into a double-refund.
  let shouldRefund = false;
  try {
    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(bookingRef);
      if (!fresh.exists) return;
      const freshData = fresh.data()!;
      if (freshData.status !== 'pending' || freshData.refundId) return;

      tx.update(bookingRef, {
        status: 'cancelled',
        cancellationReason: CANCELLATION_REASON,
        cancelledAt: FieldValue.serverTimestamp(),
        refundStatus: 'pending',
      });
      shouldRefund = true;
    });
  } catch (err) {
    console.error(`[cancelExpiredBookings] ${bookingId}: transaction failed:`, err);
    return;
  }

  if (!shouldRefund) {
    console.log(`[cancelExpiredBookings] ${bookingId}: skipped (not pending or already processed)`);
    return;
  }

  console.log(`[cancelExpiredBookings] ${bookingId}: flipped to cancelled, issuing refund`);
  await refundBooking(bookingId, bookingRef, data);
}

async function refundBooking(
  bookingId: string,
  bookingRef: FirebaseFirestore.DocumentReference,
  data: PendingBookingDoc
): Promise<void> {
  if (!data.paymentIntentId) {
    console.warn(`[cancelExpiredBookings] ${bookingId}: no paymentIntentId, cannot refund`);
    await bookingRef.set({ refundStatus: 'skipped_no_payment_intent' }, { merge: true });
    return;
  }
  if (!data.amountPaid || data.amountPaid <= 0) {
    console.log(`[cancelExpiredBookings] ${bookingId}: amountPaid is ${data.amountPaid}, nothing to refund`);
    await bookingRef.set({ refundStatus: 'skipped_zero_amount' }, { merge: true });
    return;
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: data.paymentIntentId,
      // amountPaid is dollars; only refund what was actually charged now
      // (may be a deposit, not the full totalPrice).
      amount: Math.round(data.amountPaid * 100),
    });

    await bookingRef.set(
      {
        refundId: refund.id,
        refundStatus: refund.status ?? 'submitted',
        refundedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`[cancelExpiredBookings] ${bookingId}: refund ${refund.id} created (status=${refund.status})`);
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeError ? err.message : String(err);
    console.error(`[cancelExpiredBookings] ${bookingId}: refund FAILED:`, message);
    // Leave status as 'cancelled' - do not roll back. A failed refund becomes
    // a manual follow-up item (visible via refundStatus), not a retry loop.
    await bookingRef.set({ refundStatus: 'failed', refundError: message }, { merge: true });
  }
}

export function startCancelExpiredBookingsJob(): void {
  const schedule = process.env.CANCEL_EXPIRED_BOOKINGS_CRON || '0 * * * *'; // hourly
  cron.schedule(schedule, () => {
    cancelExpiredPendingBookings().catch((err) =>
      console.error('[cancelExpiredBookings] unhandled error in scheduled run:', err)
    );
  });
  console.log(`[cancelExpiredBookings] job scheduled: "${schedule}"`);
}
