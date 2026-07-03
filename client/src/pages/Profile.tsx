import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

export default function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [customUserId, setCustomUserId] = useState("");
  const [memberSince, setMemberSince] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        fullName,
        phone,
      });

      await updateProfile(auth.currentUser!, { displayName: fullName });
      setSuccess(true);
    } catch (err) {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-page-header">
          <h1>Edit Profile</h1>
          <button className="back-link" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </button>
        </div>

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
                      month: "long",
                      day: "numeric",
                      year: "numeric",
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

            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. (555) 123-4567"
            />
          </div>
        </div>

        {error && <p className="profile-error">{error}</p>}
        {success && <p className="profile-success">✓ Profile updated successfully</p>}

        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}