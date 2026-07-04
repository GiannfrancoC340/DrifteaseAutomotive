import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./Profile.css";

export default function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState<string>("");
  const [customUserId, setCustomUserId] = useState("");
  const [memberSince, setMemberSince] = useState("");

  // Original values to compare against
  const [originalName, setOriginalName] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Dirty state — true if user has unsaved changes
  const isDirty = fullName !== originalName || phone !== originalPhone;

  // Warn on browser refresh/close if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    async function fetchProfile() {
      if (!currentUser) return;
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setFullName(data.fullName || "");
          setPhone(data.phone || "");
          setCustomUserId(data.customUserId || "");
          setMemberSince(data.createdAt || "");
          setOriginalName(data.fullName || "");
          setOriginalPhone(data.phone || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [currentUser]);

  async function handleSave() {
    if (!currentUser) return;

    // Validate phone if provided
    if (phone && !isValidPhoneNumber(phone)) {
      setPhoneError("Please enter a valid phone number");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);
    setPhoneError("");

    try {
      await updateDoc(doc(db, "users", currentUser.uid), { fullName, phone });
      await updateProfile(auth.currentUser!, { displayName: fullName });

      // Update originals so dirty state resets
      setOriginalName(fullName);
      setOriginalPhone(phone);
      setSuccess(true);
    } catch (err) {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    if (isDirty) {
      const choice = window.confirm(
        "You have unsaved changes. Do you want to save before leaving?"
      );
      if (choice) {
        handleSave().then(() => navigate("/dashboard"));
      } else {
        navigate("/dashboard");
      }
    } else {
      navigate("/dashboard");
    }
  }

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  return (
    <div className="profile-page">
      <div className="profile-container">

        <div className="profile-page-header">
          <h1>Edit Profile</h1>
          <button className="back-link" onClick={handleBack}>
            ← Back to Dashboard
          </button>
        </div>

        {/* Unsaved changes banner */}
        {isDirty && (
          <div className="unsaved-banner">
            ⚠️ You have unsaved changes
            <div className="unsaved-actions">
              <button className="unsaved-discard" onClick={() => {
                setFullName(originalName);
                setPhone(originalPhone);
              }}>
                Discard
              </button>
              <button className="unsaved-save" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Now"}
              </button>
            </div>
          </div>
        )}

        {/* Read-only info */}
        <div className="profile-section">
          <h2>Account Info</h2>
          <div className="profile-info-card">
            <div className="profile-info-row">
              <span>User ID</span>
              <span className="mono">{customUserId}</span>
            </div>
            <div className="profile-info-row">
              <span>Email</span>
              <span>{currentUser?.email}</span>
            </div>
            <div className="profile-info-row">
              <span>Member Since</span>
              <span>
                {memberSince
                  ? new Date(memberSince).toLocaleDateString("en-US", {
                      month: "long", day: "numeric", year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div className="profile-section">
          <h2>Personal Details</h2>
          <div className="profile-form">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />

            <label>Phone Number</label>
            <PhoneInput
              international
              defaultCountry="US"
              value={phone}
              onChange={(val) => {
                setPhone(val || "");
                setPhoneError("");
              }}
              className="phone-input-wrapper"
            />
            {phoneError && <p className="field-error">{phoneError}</p>}
          </div>
        </div>

        {error && <p className="profile-error">{error}</p>}
        {success && !isDirty && (
          <p className="profile-success">✓ Profile updated successfully</p>
        )}

        <button className="save-btn" onClick={handleSave} disabled={saving || !isDirty}>
          {saving ? "Saving..." : isDirty ? "Save Changes" : "No Changes to Save"}
        </button>

      </div>
    </div>
  );
}