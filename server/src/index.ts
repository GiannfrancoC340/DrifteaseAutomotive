import './config/firebase';
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import paymentsRouter from "./routes/payments";
import verificationRouter from "./routes/verification.routes";
import webhookRouter from "./routes/webhook.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: "http://localhost:5173" }));

// Webhook route MUST come before express.json() - it needs the raw
// request body to verify Stripe's signature, not JSON-parsed.
app.use("/api/webhooks", webhookRouter);

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "Driftease server is running" });
});

// Routes
app.use("/api/payments", paymentsRouter);
app.use("/api/verification", verificationRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;