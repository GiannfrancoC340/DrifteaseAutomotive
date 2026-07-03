import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Book.css";

export default function Book() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [paymentOption, setPaymentOption] = useState<"full" | "deposit">("full");

  const { startDate, endDate, totalPrice } = location.state || {};

  // Redirect if no booking state passed
  if (!startDate || !endDate || !totalPrice) {
    navigate("/vehicle");
    return null;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const depositAmount = Math.round(totalPrice * 0.3);
  const remainingAmount = totalPrice - depositAmount;
  const amountDueNow = paymentOption === "full" ? totalPrice : depositAmount;

  function handleProceed() {
    navigate("/checkout", {
      state: {
        startDate,
        endDate,
        totalPrice,
        amountDueNow,
        paymentOption,
        depositAmount,
        remainingAmount,
      },
    });
  }

  return (
    <div className="book-page">
      <div className="book-container">
        <h1>Review Your Booking</h1>

        {/* Trip Summary */}
        <div className="book-section">
          <h2>Trip Details</h2>
          <div className="summary-card">
            <div className="summary-row">
              <span>Vehicle</span>
              <span>2022 Toyota Camry</span>
            </div>
            <div className="summary-row">
              <span>Pickup</span>
              <span>{start.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="summary-row">
              <span>Return</span>
              <span>{end.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="summary-row">
              <span>Duration</span>
              <span>{days} day{days !== 1 ? "s" : ""}</span>
            </div>
            <div className="summary-row total">
              <span>Total Rental Cost</span>
              <span>${totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Payment Option */}
        <div className="book-section">
          <h2>Payment Option</h2>
          <div className="payment-options">
            <div
              className={`payment-option ${paymentOption === "full" ? "selected" : ""}`}
              onClick={() => setPaymentOption("full")}
            >
              <div className="option-header">
                <div className="option-radio">{paymentOption === "full" ? "●" : "○"}</div>
                <div>
                  <p className="option-title">Pay in Full</p>
                  <p className="option-subtitle">Pay the entire amount now</p>
                </div>
              </div>
              <p className="option-amount">${totalPrice}</p>
            </div>

            <div
              className={`payment-option ${paymentOption === "deposit" ? "selected" : ""}`}
              onClick={() => setPaymentOption("deposit")}
            >
              <div className="option-header">
                <div className="option-radio">{paymentOption === "deposit" ? "●" : "○"}</div>
                <div>
                  <p className="option-title">Pay Deposit Now</p>
                  <p className="option-subtitle">30% now, remainder due at pickup</p>
                </div>
              </div>
              <div className="option-amount-split">
                <p className="option-amount">${depositAmount} <span>due now</span></p>
                <p className="option-remaining">${remainingAmount} due at pickup</p>
              </div>
            </div>
          </div>
        </div>

        {/* Renter Info */}
        <div className="book-section">
          <h2>Renter</h2>
          <div className="summary-card">
            <div className="summary-row">
              <span>Name</span>
              <span>{currentUser?.displayName || "—"}</span>
            </div>
            <div className="summary-row">
              <span>Email</span>
              <span>{currentUser?.email}</span>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="book-section">
          <h2>What Happens Next</h2>
          <ol className="next-steps">
            <li>Upload your driver's license on the next page</li>
            <li>Sign the rental agreement digitally</li>
            <li>Complete payment via Stripe</li>
            <li>Receive a booking confirmation email</li>
            <li>Upload pre-trip photos when you pick up the car</li>
          </ol>
        </div>

        {/* CTA */}
        <div className="book-cta">
          <div className="cta-summary">
            <span>Due today</span>
            <span className="cta-amount">${amountDueNow}</span>
          </div>
          <button className="proceed-btn" onClick={handleProceed}>
            Continue to Payment →
          </button>
          <button className="back-btn" onClick={() => navigate("/vehicle")}>
            ← Back to Vehicle
          </button>
        </div>
      </div>
    </div>
  );
}