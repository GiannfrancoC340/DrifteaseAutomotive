import { Request, Response } from 'express';
import Stripe from 'stripe';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { AuthedRequest } from '../middleware/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const db = getFirestore();

interface LicenseVerification {
  status: 'not_started' | 'pending' | 'processing' | 'verified' | 'failed' | 'canceled';
  sessionId?: string;
  email?: string | null;
  failureReason?: string;
  createdAt?: FieldValue;
  verifiedAt?: FieldValue;
  updatedAt?: FieldValue;
}

/**
 * POST /api/verification/create-session
 * Creates a Stripe Identity VerificationSession for the authenticated user.
 */
export async function createVerificationSession(req: AuthedRequest, res: Response) {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email;

    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userDoc = await db.collection('users').doc(uid).get();
    const existing = userDoc.data()?.licenseVerification as LicenseVerification | undefined;

    if (existing?.status === 'verified') {
      return res.status(200).json({ alreadyVerified: true, status: 'verified' });
    }

    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        firebaseUid: uid,
      },
      options: {
        document: {
          allowed_types: ['driving_license'],
          require_matching_selfie: true,
        },
      },
    });

    const licenseVerification: LicenseVerification = {
      status: 'pending',
      sessionId: session.id,
      createdAt: FieldValue.serverTimestamp(),
      email: email || null,
    };

    await db.collection('users').doc(uid).set({ licenseVerification }, { merge: true });

    return res.status(201).json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    });
  } catch (err) {
    console.error('Error creating verification session:', err);
    return res.status(500).json({ error: 'Failed to create verification session' });
  }
}

/**
 * GET /api/verification/status
 * Returns the current license verification status for the authenticated user.
 */
export async function getVerificationStatus(req: AuthedRequest, res: Response) {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userDoc = await db.collection('users').doc(uid).get();
    const licenseVerification = userDoc.data()?.licenseVerification as LicenseVerification | undefined;

    if (!licenseVerification) {
      return res.status(200).json({ status: 'not_started' });
    }

    return res.status(200).json(licenseVerification);
  } catch (err) {
    console.error('Error fetching verification status:', err);
    return res.status(500).json({ error: 'Failed to fetch verification status' });
  }
}

/**
 * POST /api/webhooks/stripe-identity
 * Stripe calls this when a verification session changes state.
 * Requires the RAW request body - see routes/webhook.routes.ts.
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw buffer (Buffer, not parsed JSON)
      sig,
      process.env.STRIPE_IDENTITY_WEBHOOK_SECRET as string
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  const session = event.data.object as Stripe.Identity.VerificationSession;
  const uid = session.metadata?.firebaseUid;

  if (!uid) {
    console.warn('Webhook event missing firebaseUid metadata:', event.id);
    return res.status(200).json({ received: true });
  }

  try {
    const userRef = db.collection('users').doc(uid);

    switch (event.type) {
      case 'identity.verification_session.verified':
        await userRef.set(
          {
            licenseVerification: {
              status: 'verified',
              sessionId: session.id,
              verifiedAt: FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );
        break;

      case 'identity.verification_session.requires_input': {
        const reason = session.last_error?.reason || 'unknown_error';
        await userRef.set(
          {
            licenseVerification: {
              status: 'failed',
              sessionId: session.id,
              failureReason: reason,
              updatedAt: FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );
        break;
      }

      case 'identity.verification_session.processing':
        await userRef.set(
          {
            licenseVerification: {
              status: 'processing',
              sessionId: session.id,
              updatedAt: FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );
        break;

      case 'identity.verification_session.canceled':
        await userRef.set(
          {
            licenseVerification: {
              status: 'canceled',
              sessionId: session.id,
              updatedAt: FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );
        break;

      default:
        console.log(`Unhandled Stripe Identity event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error processing webhook event:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}