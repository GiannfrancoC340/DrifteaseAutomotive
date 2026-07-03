import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUserData } from "../hooks/useUserData";
import type { Booking } from "../hooks/useUserData";
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

function BookingCard({ booking }: { booking: Booking }) {
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="booking-card">
      <div className="booking-card-header">
        <span className="booking-card-id">{booking.id}</span>
        <StatusBadge status={booking.status} />
      </div>
      <div className="booking-card-body">
        <div className="booking-card-row">
          <span>Vehicle</span>
          <span>2022 Toyota Camry</span>
        </div>
        <div className="booking-card-row">
          <span>Pickup</span>
          <span>{start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        <div className="booking-card-row">
          <span>Return</span>
          <span>{end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        <div className="booking-card-row">
          <span>Duration</span>
          <span>{days} day{days !== 1 ? "s" : ""}</span>
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
      {booking.status === "pending" && (
        <div className="booking-card-actions">
          <p className="action-note">⏳ Awaiting host approval</p>
        </div>
      )}
      {booking.status === "approved" && (
        <div className="booking-card-actions">
          <p className="action-note">✅ Approved — upload pre-trip photos at pickup</p>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { profile, bookings, loading } = useUserData();
  const [activeTab, setActiveTab] = useState<"bookings" | "profile">("bookings");
  const navigate = useNavigate();

  const upcomingBookings = bookings.filter((b) =>
    ["pending", "approved", "active"].includes(b.status)
  );
  const pastBookings = bookings.filter((b) =>
    ["completed", "cancelled"].includes(b.status)
  );

  if (loading) {
    return <div className="dashboard-loading">Loading your dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        {/* Welcome header */}
        <div className="dashboard-header">
          <div>
            <h1>Welcome back, {currentUser?.displayName?.split(" ")[0] || "there"}</h1>
          </div>
          <button className="book-new-btn" onClick={() => navigate("/vehicle")}>
            + Book a Trip
          </button>
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            My Bookings {bookings.length > 0 && <span className="tab-count">{bookings.length}</span>}
          </button>
          <button
            className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
        </div>

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="tab-content">
            {bookings.length === 0 ? (
              <div className="empty-state">
                <p>🚗 No bookings yet</p>
                <p className="empty-sub">Book your first trip to get started</p>
                <button className="book-new-btn" onClick={() => navigate("/vehicle")}>
                  View the Car
                </button>
              </div>
            ) : (
              <>
                {upcomingBookings.length > 0 && (
                  <div className="bookings-section">
                    <h2>Upcoming & Active</h2>
                    <div className="bookings-grid">
                      {upcomingBookings.map((b) => (
                        <BookingCard key={b.id} booking={b} />
                      ))}
                    </div>
                  </div>
                )}
                {pastBookings.length > 0 && (
                  <div className="bookings-section">
                    <h2>Past Bookings</h2>
                    <div className="bookings-grid">
                      {pastBookings.map((b) => (
                        <BookingCard key={b.id} booking={b} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="tab-content">
            <div className="profile-card">
              <div className="profile-row">
                <span>Full Name</span>
                <span>{profile?.fullName || "—"}</span>
              </div>
              <div className="profile-row">
                <span>Email</span>
                <span>{profile?.email || currentUser?.email}</span>
              </div>
              <div className="profile-row">
                <span>Phone</span>
                <span>{profile?.phone || "Not added"}</span>
              </div>
              <div className="profile-row">
                <span>User ID</span>
                <span className="profile-id">{profile?.customUserId || "—"}</span>
              </div>
              <div className="profile-row">
                <span>Member Since</span>
                <span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}</span>
              </div>
              <div className="profile-row">
                <span>Role</span>
                <span className="profile-role">{profile?.role || "renter"}</span>
              </div>
            </div>
            <button className="edit-profile-btn" onClick={() => navigate("/profile")}>
              Edit Profile →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}