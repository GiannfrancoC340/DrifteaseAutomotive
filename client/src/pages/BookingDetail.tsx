import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import "./BookingDetail.css";

interface BookingData {
  renterId: string;
  renterEmail: string;
  renterName: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  amountPaid: number;
  remainingAmount: number;
  paymentOption: string;
  depositPercent: number;
  status: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "badge-pending",
    approved: "badge-approved",
    active: "badge-active",
    completed: "badge-completed",
    cancelled: "badge-cancelled",
  };
  return (
    <span className={`badge ${colors[status] || "badge-pending"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBooking() {
      if (!id || !currentUser) return;
      try {
        const snap = await getDoc(doc(db, "bookings", id));
        if (!snap.exists() || snap.data().renterId !== currentUser.uid) {
          navigate("/dashboard");
          return;
        }
        setBooking(snap.data() as BookingData);
      } catch (err) {
        console.error("Error fetching booking:", err);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [id, currentUser, navigate]);

  async function handleCancel() {
    if (!id) return;
    const confirmed = window.confirm(
      "Cancel this booking? This cannot be undone."
    );
    if (!confirmed) return;

    setCancelling(true);
    setError("");
    try {
      await updateDoc(doc(db, "bookings", id), { status: "cancelled" });
      setBooking((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setError("Failed to cancel booking. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <div className="booking-detail-loading">Loading booking...</div>;
  }

  if (!booking) return null;

  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="booking-detail-page">
      <div className="booking-detail-container">
        <button className="back-link" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>

        <div className="booking-detail-header">
          <span className="booking-detail-id">{id}</span>
          <StatusBadge status={booking.status} />
        </div>

        <div className="booking-detail-section">
          <h2>Trip Details</h2>
          <div className="booking-detail-card">
            <div className="detail-row">
              <span>Vehicle</span>
              <span>2022 Toyota Camry</span>
            </div>
            <div className="detail-row">
              <span>Pickup</span>
              <span>{start.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="detail-row">
              <span>Return</span>
              <span>{end.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="detail-row">
              <span>Duration</span>
              <span>{days} day{days !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        <div className="booking-detail-section">
          <h2>Payment Info</h2>
          <div className="booking-detail-card">
            <div className="detail-row">
              <span>Total rental cost</span>
              <span>${booking.totalPrice}</span>
            </div>
            <div className="detail-row">
              <span>
                {booking.paymentOption === "full"
                  ? "Paid in full"
                  : `Deposit paid (${booking.depositPercent}%)`}
              </span>
              <span className="paid-amount">${booking.amountPaid} ✓</span>
            </div>
            {booking.remainingAmount > 0 && (
              <div className="detail-row remaining">
                <span>Remaining balance due at pickup</span>
                <span>${booking.remainingAmount}</span>
              </div>
            )}
          </div>
        </div>

        <div className="booking-detail-section">
          <h2>Renter Info</h2>
          <div className="booking-detail-card">
            <div className="detail-row">
              <span>Name</span>
              <span>{booking.renterName || "—"}</span>
            </div>
            <div className="detail-row">
              <span>Email</span>
              <span>{booking.renterEmail}</span>
            </div>
          </div>
        </div>

        {error && <p className="detail-error">{error}</p>}

        {booking.status === "pending" ? (
          <button className="cancel-btn" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? "Cancelling..." : "Cancel Booking"}
          </button>
        ) : booking.status === "cancelled" ? (
          <p className="cancelled-note">This booking has been cancelled.</p>
        ) : (
          <p className="no-cancel-note">
            This booking is already {booking.status} and can no longer be cancelled here. Contact support for help.
          </p>
        )}
      </div>
    </div>
  );
}
