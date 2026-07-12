import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { MIN_RENTAL_AGE, calculateAge } from "../lib/renterEligibility";
import "./Profile.css";

export default function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState<string>("");
  const [customUserId, setCustomUserId] = useState("");
  const [memberSince, setMemberSince] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [driversLicenseNumber, setDriversLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [licenseExpiration, setLicenseExpiration] = useState("");

  // Original values to compare against
  const [originalName, setOriginalName] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [originalDob, setOriginalDob] = useState("");
  const [originalLicenseNumber, setOriginalLicenseNumber] = useState("");
  const [originalLicenseState, setOriginalLicenseState] = useState("");
  const [originalLicenseExpiration, setOriginalLicenseExpiration] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [dobError, setDobError] = useState("");
  const [licenseExpirationError, setLicenseExpirationError] = useState("");

  // Dirty state — true if user has unsaved changes
  const isDirty =
    fullName !== originalName ||
    phone !== originalPhone ||
    dateOfBirth !== originalDob ||
    driversLicenseNumber !== originalLicenseNumber ||
    licenseState !== originalLicenseState ||
    licenseExpiration !== originalLicenseExpiration;

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
          setDateOfBirth(data.dateOfBirth || "");
          setDriversLicenseNumber(data.driversLicenseNumber || "");
          setLicenseState(data.licenseState || "");
          setLicenseExpiration(data.licenseExpiration || "");

          setOriginalName(data.fullName || "");
          setOriginalPhone(data.phone || "");
          setOriginalDob(data.dateOfBirth || "");
          setOriginalLicenseNumber(data.driversLicenseNumber || "");
          setOriginalLicenseState(data.licenseState || "");
          setOriginalLicenseExpiration(data.licenseExpiration || "");
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

    setPhoneError("");
    setDobError("");
    setLicenseExpirationError("");

    // Validate phone if provided
    if (phone && !isValidPhoneNumber(phone)) {
      setPhoneError("Please enter a valid phone number");
      return;
    }

    // Validate DOB if provided - can't be in the future, can't be under
    // the minimum rental age. Left optional at the field level; Book.tsx
    // enforces it as required before checkout.
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (dob > new Date()) {
        setDobError("Date of birth can't be in the future");
        return;
      }
      if (calculateAge(dateOfBirth) < MIN_RENTAL_AGE) {
        setDobError(`You must be at least ${MIN_RENTAL_AGE} years old to rent`);
        return;
      }
    }

    // License expiration can be saved even if already expired (so the
    // record is accurate) - Book.tsx blocks checkout on an expired license,
    // this just catches an obviously malformed date here.
    if (licenseExpiration && isNaN(new Date(licenseExpiration).getTime())) {
      setLicenseExpirationError("Please enter a valid date");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        fullName,
        phone,
        dateOfBirth,
        driversLicenseNumber,
        licenseState,
        licenseExpiration,
      });
      await updateProfile(auth.currentUser!, { displayName: fullName });

      // Update originals so dirty state resets
      setOriginalName(fullName);
      setOriginalPhone(phone);
      setOriginalDob(dateOfBirth);
      setOriginalLicenseNumber(driversLicenseNumber);
      setOriginalLicenseState(licenseState);
      setOriginalLicenseExpiration(licenseExpiration);
      setSuccess(true);
    } catch (err) {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setFullName(originalName);
    setPhone(originalPhone);
    setDateOfBirth(originalDob);
    setDriversLicenseNumber(originalLicenseNumber);
    setLicenseState(originalLicenseState);
    setLicenseExpiration(originalLicenseExpiration);
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
              <button className="unsaved-discard" onClick={handleDiscard}>
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

            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => {
                setDateOfBirth(e.target.value);
                setDobError("");
              }}
            />
            {dobError && <p className="field-error">{dobError}</p>}
          </div>
        </div>

        <div className="profile-section">
          <h2>Driver's License</h2>
          <div className="profile-form">
            <label htmlFor="driversLicenseNumber">License Number</label>
            <input
              id="driversLicenseNumber"
              type="text"
              value={driversLicenseNumber}
              onChange={(e) => setDriversLicenseNumber(e.target.value)}
              placeholder="License number"
            />

            <label htmlFor="licenseState">State (optional)</label>
            <input
              id="licenseState"
              type="text"
              value={licenseState}
              onChange={(e) => setLicenseState(e.target.value.toUpperCase())}
              placeholder="e.g. FL"
              maxLength={2}
            />

            <label htmlFor="licenseExpiration">Expiration Date</label>
            <input
              id="licenseExpiration"
              type="date"
              value={licenseExpiration}
              onChange={(e) => {
                setLicenseExpiration(e.target.value);
                setLicenseExpirationError("");
              }}
            />
            {licenseExpirationError && (
              <p className="field-error">{licenseExpirationError}</p>
            )}
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