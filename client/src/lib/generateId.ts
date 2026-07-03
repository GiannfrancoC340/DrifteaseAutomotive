import { db } from "./firebase";
import { doc, runTransaction } from "firebase/firestore";

function randomChars(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function generateBookingId(): string {
  return `DRF-${getDateString()}-${randomChars(4)}`;
}

export async function generateUserId(): Promise<string> {
  const counterRef = doc(db, "counters", "users");

  const userNumber = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);

    if (!counterSnap.exists()) {
      transaction.set(counterRef, { count: 1 });
      return 1;
    }

    const newCount = counterSnap.data().count + 1;
    transaction.update(counterRef, { count: newCount });
    return newCount;
  });

  return `DRF-user${userNumber}-${getDateString()}-${randomChars(4)}`;
}