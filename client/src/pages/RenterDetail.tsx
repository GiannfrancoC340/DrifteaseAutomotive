import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminRenters } from "../hooks/useAdminRenters";
import "./BookingDetail.css";

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

export default function RenterDetail() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { renters, loading, error, overrideLicenseStatus } = useAdminRenters();
  const [updating, setUpdating] = useState(false);
  const [overrideError, setOverrideError] = useState("");

  if (loading) {
    return <div className="booking-detail-loading">Loading renter...</div>;
  }

  const renter = renters.find((r) => r.uid === uid);

  if (!renter) {
    return (
      <div className="booking-detail-page">
        <div className="booking-detail-container">
          <button className="back-link" onClick={() => navigate("/admin")}>
            ← Back to Admin Dashboard
          </button>
          <p className="detail-error">{error || "Renter not found."}</p>
        </div>
      </div>
    );
  }

  const licenseStatus = renter.licenseVerification?.status || "not_started";

  async function handleOverride(status: "verified" | "failed") {
    if (!renter) return;
    setUpdating(true);
    setOverrideError("");
    try {
      await overrideLicenseStatus(renter.uid, status);
    } catch {
      setOverrideError("Failed to update license status. Please try again.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="booking-detail-page">
      <div className="booking-detail-container">
        <button className="back-link" onClick={() => navigate("/admin")}>
          ← Back to Admin Dashboard
        </button>

        <div className="booking-detail-header">
          <span className="booking-detail-id">
            {renter.fullName || renter.email || renter.uid}
          </span>
          <LicenseBadge status={licenseStatus} />
        </div>

        <div className="booking-detail-section">
          <h2>Renter Info</h2>
          <div className="booking-detail-card">
            <div className="detail-row">
              <span>Email</span>
              <span>{renter.email || "—"}</span>
            </div>
            <div className="detail-row">
              <span>Phone</span>
              <span>{renter.phone || "Not added"}</span>
            </div>
            <div className="detail-row">
              <span>User ID</span>
              <span>{renter.customUserId || "—"}</span>
            </div>
            <div className="detail-row">
              <span>Role</span>
              <span>{renter.role || "renter"}</span>
            </div>
            <div className="detail-row">
              <span>Member Since</span>
              <span>
                {renter.createdAt
                  ? new Date(renter.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="booking-detail-section">
          <h2>License Verification</h2>
          <div className="booking-detail-card">
            <div className="detail-row">
              <span>Status</span>
              <LicenseBadge status={licenseStatus} />
            </div>
            {renter.licenseVerification?.manualOverride && (
              <div className="detail-row">
                <span>Manually Reviewed By</span>
                <span>{renter.licenseVerification.reviewedBy}</span>
              </div>
            )}
            {renter.licenseVerification?.failureReason && (
              <div className="detail-row">
                <span>Failure Reason</span>
                <span>{renter.licenseVerification.failureReason}</span>
              </div>
            )}
          </div>
        </div>

        {overrideError && <p className="detail-error">{overrideError}</p>}

        <div
          className="booking-card-actions"
          style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}
        >
          <button
            className="pay-btn"
            disabled={updating || licenseStatus === "verified"}
            onClick={() => handleOverride("verified")}
          >
            {updating ? "Updating..." : "Mark Verified"}
          </button>
          <button
            className="pay-btn"
            disabled={updating || licenseStatus === "failed"}
            onClick={() => handleOverride("failed")}
          >
            {updating ? "Updating..." : "Mark Failed"}
          </button>
        </div>

        <p className="no-cancel-note">
          Manual overrides bypass Stripe Identity and should only be used when
          verification was completed through another trusted method.
        </p>
      </div>
    </div>
  );
}
