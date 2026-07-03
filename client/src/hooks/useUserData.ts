import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  amountPaid: number;
  remainingAmount: number;
  paymentOption: string;
  depositPercent: number;
  status: string;
  createdAt: string;
  vehicleId: string;
}

export interface UserProfile {
  customUserId: string;
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  createdAt: string;
}

export function useUserData() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    async function fetchData() {
      try {
        // Fetch profile
        const profileSnap = await getDoc(doc(db, "users", currentUser!.uid));
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserProfile);
        }

        // Fetch bookings
        const bookingsQuery = query(
          collection(db, "bookings"),
          where("renterId", "==", currentUser!.uid)
        );
        const bookingsSnap = await getDocs(bookingsQuery);
        const bookingsList = bookingsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Booking[];

        // Sort by createdAt descending
        bookingsList.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setBookings(bookingsList);
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentUser]);

  return { profile, bookings, loading };
}