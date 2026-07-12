import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export interface LicenseVerification {
  status: "not_started" | "pending" | "processing" | "verified" | "failed" | "canceled";
  sessionId?: string;
  failureReason?: string;
  manualOverride?: boolean;
  reviewedBy?: string;
}

export interface RenterProfile {
  uid: string;
  customUserId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  createdAt?: string;
  licenseVerification?: LicenseVerification;
}

export function useAdminRenters() {
  const { isAdmin, currentUser, loading: authLoading } = useAuth();
  const [renters, setRenters] = useState<RenterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRenters = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // No filter - relies on Firestore rules allowing a full collection
      // read when request.auth.token.admin == true (see users rule)
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
      })) as RenterProfile[];

      list.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));

      setRenters(list);
      setError("");
    } catch (err) {
      console.error("Error fetching renters:", err);
      setError("Failed to load renters.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (authLoading) return;
    fetchRenters();
  }, [authLoading, fetchRenters]);

  async function overrideLicenseStatus(
    uid: string,
    status: "verified" | "failed"
  ) {
    const reviewedBy = currentUser?.email || currentUser?.uid || "admin";
    try {
      // Dot-notation keys merge into the existing licenseVerification map
      // rather than replacing it - updateDoc does NOT deep-merge plain
      // nested objects, so this avoids wiping sessionId/createdAt/etc.
      await updateDoc(doc(db, "users", uid), {
        "licenseVerification.status": status,
        "licenseVerification.manualOverride": true,
        "licenseVerification.reviewedBy": reviewedBy,
      });
      setRenters((prev) =>
        prev.map((r) =>
          r.uid === uid
            ? {
                ...r,
                licenseVerification: {
                  ...r.licenseVerification,
                  status,
                  manualOverride: true,
                  reviewedBy,
                },
              }
            : r
        )
      );
    } catch (err) {
      console.error("Error overriding license status:", err);
      throw err;
    }
  }

  return { renters, loading, error, refetch: fetchRenters, overrideLicenseStatus };
}