import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { requireAuth, AuthedRequest } from "../middleware/auth";

dotenv.config();

const router = express.Router();

router.post("/create-payment-intent", requireAuth, async (req: AuthedRequest, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

  try {
    const { amount, currency = "usd" } = req.body;

    if (!amount || typeof amount !== "number") {
      res.status(400).json({ error: "Invalid amount" });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        business: "Driftease Automotive LLC",
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: unknown) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

export default router;