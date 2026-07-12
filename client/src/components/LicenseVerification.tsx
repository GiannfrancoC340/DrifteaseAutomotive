import { useEffect, useState, useCallback } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { useAuth } from "../context/AuthContext";

type VerificationStatus =
  | "not_started"
  | "pending"
  | "processing"
  | "verified"
  | "failed"
  | "canceled"
  | "loading";

interface LicenseVerificationProps {
  onStatusChange?: (status: VerificationStatus) => void;
}

const API_BASE = "http://localhost:5001/api/verification";

export default function LicenseVerification({ onStatusChange }: LicenseVerificationProps) {
  const stripe = useStripe();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const updateStatus = useCallback(
    (next: VerificationStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange]
  );

  const fetchStatus = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      updateStatus((data.status as VerificationStatus) || "not_started");
    } catch (err) {
      console.error("Failed to fetch verification status:", err);
      setError("Could not check verification status.");
    }
  }, [currentUser, updateStatus]);

  // Check status on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // While pending/processing, poll every 3s for up to ~30s so the UI
  // catches the webhook update without the user needing to refresh.
  useEffect(() => {
    if (status !== "pending" && status !== "processing") return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      fetchStatus();
      if (attempts >= 10) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  }, [status, fetchStatus]);

  async function handleVerify() {
    if (!stripe || !currentUser) return;
    setError("");
    setStarting(true);

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE}/create-session`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      if (data.alreadyVerified) {
        updateStatus("verified");
        setStarting(false);
        return;
      }

      if (!data.clientSecret) {
        setError("Failed to start verification. Please try again.");
        setStarting(false);
        return;
      }

      const { error: stripeError } = await stripe.verifyIdentity(data.clientSecret);

      if (stripeError) {
        // User closed the modal or it errored client-side - not
        // necessarily a failed verification, just re-check status
        console.warn("Identity modal closed:", stripeError.message);
      }

      // Webhook updates Firestore async - re-check status now and let
      // the polling effect above pick up the eventual verified state
      await fetchStatus();
    } catch (err) {
      console.error("Verification error:", err);
      setError("Something went wrong starting verification.");
    } finally {
      setStarting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="checkout-section">
        <h2>Driver's License</h2>
        <p className="checkout-note">Checking verification status...</p>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div className="checkout-section">
        <h2>Driver's License</h2>
        <p className="checkout-note">✅ Your license has been verified.</p>
      </div>
    );
  }

  if (status === "pending" || status === "processing") {
    return (
      <div className="checkout-section">
        <h2>Driver's License</h2>
        <p className="checkout-note">
          ⏳ Your verification is being reviewed. This usually only takes a moment.
        </p>
      </div>
    );
  }

  // not_started, failed, or canceled - show the button
  return (
    <div className="checkout-section">
      <h2>Driver's License</h2>
      <p className="checkout-note">
        Verify your driver's license to complete your booking. You'll be asked to
        photograph your license and take a quick selfie.
      </p>
      {status === "failed" && (
        <p className="checkout-error">
          Verification wasn't successful. Please try again.
        </p>
      )}
      {error && <p className="checkout-error">{error}</p>}
      <button
        type="button"
        className="pay-btn"
        onClick={handleVerify}
        disabled={!stripe || starting}
      >
        {starting ? "Starting..." : "Verify My License"}
      </button>
    </div>
  );
}