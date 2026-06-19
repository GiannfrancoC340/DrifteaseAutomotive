import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate("/login");
  }

  return (
    <div className="page">
      <h1>Welcome, {currentUser?.displayName || currentUser?.email}</h1>
      <p>This is your dashboard. We'll build this out next.</p>
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
}