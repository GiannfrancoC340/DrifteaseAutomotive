import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    // Logged in, but not an admin - send them to their normal dashboard
    // rather than the login page, since they ARE authenticated.
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}