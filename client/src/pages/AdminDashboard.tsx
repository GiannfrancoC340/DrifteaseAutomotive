import { useState } from "react";
import { useAdminBookings } from "../hooks/useAdminBookings";
import type { AdminBooking } from "../hooks/useAdminBookings";
import "./Dashboard.css";

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

// Defines which action buttons are valid for each current status.
// Keeping this centralized avoids admins accidentally setting invalid
// transitions (e.g. jumping straight from pending to completed).
const STATUS_ACTIONS: Record<string, { label: string; next: string }[]> = {
  pending: [
    { label: "Approve", next: "approved" },
    { label: "Cancel", next: "cancelled" },
  ],
  approved: [
    { label: "Mark Picked Up", next: "active" },
    { label: "Cancel", next: "cancelled" },
  ],
  active: [{ label: "Mark Completed", next: "completed" }],
  completed: [],
  cancelled: [],
};

function AdminBookingCard({
  booking,
  onUpdateStatus,
}: {
  booking: AdminBooking;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const actions = STATUS_ACTIONS[booking.status] || [];

  async function handleAction(nextStatus: string) {
    setUpdating(true);
    try {
      await onUpdateStatus(booking.id, nextStatus);
    } catch {
      // error already logged in the hook; nothing further needed here
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="booking-card">
      <div className="booking-card-header">
        <span className="booking-card-id">{booking.id}</span>
        <StatusBadge status={booking.status} />
      </div>
      <div className="booking-card-body">
        <div className="booking-card-row">
          <span>Renter</span>
          <span>{booking.renterName || booking.renterEmail || "—"}</span>
        </div>
        <div className="booking-card-row">
          <span>Email</span>
          <span>{booking.renterEmail || "—"}</span>
        </div>
        <div className="booking-card-row">
          <span>Vehicle</span>
          <span>2022 Toyota Camry</span>
        </div>
        <div className="booking-card-row">
          <span>Pickup</span>
          <span>
            {start.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="booking-card-row">
          <span>Return</span>
          <span>
            {end.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="booking-card-row">
          <span>Duration</span>
          <span>
            {days} day{days !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="booking-card-row">
          <span>Total</span>
          <span>${booking.totalPrice}</span>
        </div>
        <div className="booking-card-row">
          <span>Paid</span>
          <span className="paid">${booking.amountPaid}</span>
        </div>
        {booking.remainingAmount > 0 && (
          <div className="booking-card-row">
            <span>Due at pickup</span>
            <span className="remaining">${booking.remainingAmount}</span>
          </div>
        )}
      </div>
      {actions.length > 0 && (
        <div className="booking-card-actions" style={{ display: "flex", gap: "0.5rem" }}>
          {actions.map((action) => (
            <button
              key={action.next}
              className="pay-btn"
              disabled={updating}
              onClick={() => handleAction(action.next)}
            >
              {updating ? "Updating..." : action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { bookings, loading, error, updateBookingStatus } = useAdminBookings();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredBookings =
    statusFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);

  if (loading) {
    return <div className="dashboard-loading">Loading bookings...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>{bookings.length} total booking{bookings.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {error && <p className="checkout-error">{error}</p>}

        <div className="dashboard-tabs">
          {["all", "pending", "approved", "active", "completed", "cancelled"].map(
            (status) => (
              <button
                key={status}
                className={`tab-btn ${statusFilter === status ? "active" : ""}`}
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== "all" && (
                  <span className="tab-count">
                    {bookings.filter((b) => b.status === status).length}
                  </span>
                )}
              </button>
            )
          )}
        </div>

        <div className="tab-content">
          {filteredBookings.length === 0 ? (
            <div className="empty-state">
              <p>No bookings{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}</p>
            </div>
          ) : (
            <div className="bookings-grid">
              {filteredBookings.map((b) => (
                <AdminBookingCard
                  key={b.id}
                  booking={b}
                  onUpdateStatus={updateBookingStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}