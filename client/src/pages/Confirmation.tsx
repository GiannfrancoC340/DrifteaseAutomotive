import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "./Confirmation.css";

export default function Confirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  useEffect(() => {
    if (!state) {
      navigate("/vehicle");
    }
  }, []);

  if (!state) return null;

  const {
    bookingId,
    startDate,
    endDate,
    totalPrice,
    amountDueNow,
    remainingAmount,
    paymentOption,
    depositPercent,
  } = state;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">

        {/* Success header */}
        <div className="confirmation-header">
          <div className="success-icon">✓</div>
          <h1>Booking Confirmed!</h1>
          <p>Your booking request has been submitted successfully. The host will review and approve it shortly.</p>
        </div>

        {/* Booking ID */}
        <div className="booking-id-card">
          <span className="booking-id-label">Booking ID</span>
          <span className="booking-id-value">{bookingId}</span>
        </div>

        {/* Trip details */}
        <div className="confirmation-section">
          <h2>Trip Summary</h2>
          <div className="confirmation-card">
            <div className="conf-row">
              <span>Vehicle</span>
              <span>2022 Toyota Camry</span>
            </div>
            <div className="conf-row">
              <span>Pickup</span>
              <span>{start.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="conf-row">
              <span>Return</span>
              <span>{end.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="conf-row">
              <span>Duration</span>
              <span>{days} day{days !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        {/* Payment summary */}
        <div className="confirmation-section">
          <h2>Payment Summary</h2>
          <div className="confirmation-card">
            <div className="conf-row">
              <span>Total rental cost</span>
              <span>${totalPrice}</span>
            </div>
            <div className="conf-row">
              <span>
                {paymentOption === "full"
                  ? "Paid in full"
                  : `Deposit paid (${depositPercent}%)`}
              </span>
              <span className="paid-amount">${amountDueNow} ✓</span>
            </div>
            {paymentOption === "deposit" && (
              <div className="conf-row remaining">
                <span>Remaining balance due at pickup</span>
                <span>${remainingAmount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Next steps */}
        <div className="confirmation-section">
          <h2>What's Next</h2>
          <div className="next-steps-list">
            <div className="next-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <p className="step-title">Await Approval</p>
                <p className="step-desc">The host will review your booking and approve it within 24 hours.</p>
              </div>
            </div>
            <div className="next-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <p className="step-title">Upload Your License</p>
                <p className="step-desc">Upload the front and back of your driver's license from your dashboard.</p>
              </div>
            </div>
            <div className="next-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <p className="step-title">Pick Up the Car</p>
                <p className="step-desc">Take pre-trip photos before driving away to document the car's condition.</p>
              </div>
            </div>
            {paymentOption === "deposit" && (
              <div className="next-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <p className="step-title">Pay Remaining Balance</p>
                  <p className="step-desc">Pay ${remainingAmount} at pickup to complete your payment.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="confirmation-actions">
          <button className="dashboard-btn" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </button>
          <button className="vehicle-btn" onClick={() => navigate("/vehicle")}>
            Back to Vehicle
          </button>
        </div>
      </div>
    </div>
  );
}