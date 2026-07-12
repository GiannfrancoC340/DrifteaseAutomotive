import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminBookings } from "../hooks/useAdminBookings";
import type { AdminBooking } from "../hooks/useAdminBookings";
import { useAdminRenters } from "../hooks/useAdminRenters";
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

function LicenseBadge({ status }: { status?: string }) {
  const resolved = status || "not_started";
  const colors: Record<string, string> = {
    not_started: "badge-cancelled",
    pending: "badge-pending",
    processing: "badge-pending",
    verified: "badge-completed",
    failed: "badge-cancelled",
    canceled: "badge-cancelled",
  };
  const labels: Record<string, string> = {
    not_started: "Not Started",
    pending: "Pending",
    processing: "Processing",
    verified: "Verified",
    failed: "Failed",
    canceled: "Canceled",
  };
  return (
    <span className={`badge ${colors[resolved] || "badge-pending"}`}>
      {labels[resolved] || resolved}
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

function BookingsView() {
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
    <>
      <p>{bookings.length} total booking{bookings.length !== 1 ? "s" : ""}</p>

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
    </>
  );
}

function RentersView() {
  const { renters, loading, error } = useAdminRenters();
  const navigate = useNavigate();

  if (loading) {
    return <div className="dashboard-loading">Loading renters...</div>;
  }

  return (
    <>
      <p>{renters.length} total renter{renters.length !== 1 ? "s" : ""}</p>

      {error && <p className="checkout-error">{error}</p>}

      <div className="tab-content">
        {renters.length === 0 ? (
          <div className="empty-state">
            <p>No renters found</p>
          </div>
        ) : (
          <div className="bookings-grid">
            {renters.map((renter) => (
              <div
                key={renter.uid}
                className="booking-card"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/admin/renter/${renter.uid}`)}
              >
                <div className="booking-card-header">
                  <span className="booking-card-id">
                    {renter.fullName || "Unnamed"}
                  </span>
                  <LicenseBadge status={renter.licenseVerification?.status} />
                </div>
                <div className="booking-card-body">
                  <div className="booking-card-row">
                    <span>Email</span>
                    <span>{renter.email || "—"}</span>
                  </div>
                  <div className="booking-card-row">
                    <span>Role</span>
                    <span>{renter.role || "renter"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminDashboard() {
  const [view, setView] = useState<"bookings" | "renters">("bookings");

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
          </div>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${view === "bookings" ? "active" : ""}`}
            onClick={() => setView("bookings")}
          >
            Bookings
          </button>
          <button
            className={`tab-btn ${view === "renters" ? "active" : ""}`}
            onClick={() => setView("renters")}
          >
            Renters
          </button>
        </div>

        {view === "bookings" ? <BookingsView /> : <RentersView />}
      </div>
    </div>
  );
}