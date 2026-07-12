import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import type { Booking } from "./useUserData";

// Extends the renter-facing Booking type with fields admins need to see
// that renters' own bookings already carry but the shared type omits.
export interface AdminBooking extends Booking {
  renterId: string;
  renterEmail: string;
  renterName: string;
}

export function useAdminBookings() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBookings = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // No `where` filter here - relies on Firestore rules allowing a
      // full collection read when request.auth.token.admin == true
      const snap = await getDocs(collection(db, "bookings"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AdminBooking[];

      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setBookings(list);
      setError("");
    } catch (err) {
      console.error("Error fetching admin bookings:", err);
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (authLoading) return;
    fetchBookings();
  }, [authLoading, fetchBookings]);

  async function updateBookingStatus(bookingId: string, status: string) {
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status });
      // Reflect the change locally without a full re-fetch
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    } catch (err) {
      console.error("Error updating booking status:", err);
      throw err;
    }
  }

  return { bookings, loading, error, refetch: fetchBookings, updateBookingStatus };
}