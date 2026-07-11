import { Router, raw } from 'express';
import { handleStripeWebhook } from '../controllers/verification.controller';

const router = Router();

// raw() is critical here - Stripe's signature check needs the untouched
// request body. This route must be mounted BEFORE express.json() in
// src/index.ts, or excluded from it.
router.post('/stripe-identity', raw({ type: 'application/json' }), handleStripeWebhook);

export default router;