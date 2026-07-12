import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { generateBookingId } from "../lib/generateId";
import LicenseVerification from "../components/LicenseVerification";
import "./Checkout.css";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Inner form component — must be inside <Elements>
function CheckoutForm({ bookingData }: { bookingData: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [licenseUploaded, setLicenseUploaded] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("You must agree to the rental agreement before proceeding");
      return;
    }

    if (!licenseUploaded) {
      setError("You must complete driver's license verification before proceeding");
      return;
    }

    if (!stripe || !elements) return;

    setProcessing(true);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      // Save booking to Firestore
      try {
        const bookingId = generateBookingId();
        const bookingRef = doc(db, "bookings", bookingId);
        await setDoc(bookingRef, {
          renterId: currentUser?.uid,
          renterEmail: currentUser?.email,
          renterName: currentUser?.displayName,
          vehicleId: "car1",
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          totalPrice: bookingData.totalPrice,
          amountPaid: bookingData.amountDueNow,
          remainingAmount: bookingData.remainingAmount,
          paymentOption: bookingData.paymentOption,
          depositPercent: bookingData.depositPercent || 100,
          paymentIntentId: paymentIntent.id,
          status: "pending",
          createdAt: new Date().toISOString(),
          agreedToTerms: true,
          licenseUploaded: true,
        });

        navigate("/confirmation", {
          state: {
            bookingId,
            ...bookingData,
          },
        });
      } catch (err) {
        console.error("Firestore error:", err);
        setError("Payment succeeded but booking save failed. Please contact support.");
        setProcessing(false);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="checkout-form">

      {/* Driver's License Verification */}
      <LicenseVerification onStatusChange={(status) => setLicenseUploaded(status === "verified")} />

      {/* Rental Agreement */}
      <div className="checkout-section">
        <h2>Rental Agreement</h2>
        <div className="agreement-box">
          <p><strong>Driftease Automotive LLC — Rental Agreement Summary</strong></p>
          <p>By proceeding, you agree to the following terms:</p>
          <ul>
            <li>You are at least 21 years of age and hold a valid driver's license</li>
            <li>You will return the vehicle with the same fuel level</li>
            <li>No smoking or pets inside the vehicle</li>
            <li>You are responsible for any damage beyond normal wear and tear</li>
            <li>Late returns are subject to additional daily charges</li>
            <li>The vehicle may not be used for off-road driving or illegal activity</li>
            <li>Security deposit will be held and released upon satisfactory return</li>
          </ul>
          <p className="agreement-note">
            A full rental agreement will be emailed to you upon booking confirmation.
          </p>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          I have read and agree to the rental agreement terms
        </label>
      </div>

      {/* Payment */}
      <div className="checkout-section">
        <h2>Payment Details</h2>
        <div className="amount-due">
          <span>Amount due today</span>
          <span className="amount-value">${bookingData.amountDueNow}</span>
        </div>
        {bookingData.paymentOption === "deposit" && (
          <p className="deposit-note">
            Remaining balance of ${bookingData.remainingAmount} is due at pickup.
          </p>
        )}
        <div className="stripe-element-wrapper">
          <PaymentElement />
        </div>
      </div>

      {error && <p className="checkout-error">{error}</p>}

      <button
        type="submit"
        className="pay-btn"
        disabled={!stripe || processing}
      >
        {processing ? "Processing..." : `Pay $${bookingData.amountDueNow}`}
      </button>

      <p className="secure-note">🔒 Payments are securely processed by Stripe</p>
    </form>
  );
}

// Outer wrapper — fetches client secret and sets up Elements
export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");

  const bookingData = location.state;

  if (!bookingData) {
    navigate("/vehicle");
    return null;
  }

  useEffect(() => {
    async function createPaymentIntent() {
      try {
        const token = await currentUser?.getIdToken();
        const res = await fetch("http://localhost:5001/api/payments/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: bookingData.amountDueNow }),
        });
        const data = await res.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError("Failed to initialize payment. Please try again.");
        }
      } catch (err) {
        console.error(err);
        setError("Could not connect to payment server.");
      }
    }

    createPaymentIntent();
  }, []);

  if (error) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <p className="checkout-error">{error}</p>
          <button onClick={() => navigate("/book", { state: bookingData })}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <p className="loading-text">Setting up payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1>Complete Your Booking</h1>

        {/* Order summary at top */}
        <div className="checkout-summary">
          <div className="checkout-summary-row">
            <span>2022 Toyota Camry</span>
          </div>
          <div className="checkout-summary-row">
            <span>{new Date(bookingData.startDate).toLocaleDateString()} → {new Date(bookingData.endDate).toLocaleDateString()}</span>
          </div>
          <div className="checkout-summary-row total">
            <span>Total rental cost</span>
            <span>${bookingData.totalPrice}</span>
          </div>
        </div>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#4a90d9",
                fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
                borderRadius: "8px",
              },
            },
          }}
        >
          <CheckoutForm bookingData={bookingData} />
        </Elements>
      </div>
    </div>
  );
}