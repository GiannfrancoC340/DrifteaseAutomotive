import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const HIDE_ON = ["/", "/login", "/signup"];

export default function Navbar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (HIDE_ON.includes(location.pathname)) return null;

  async function handleLogout() {
    await signOut(auth);
    navigate("/");
  }

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-logo">Driftease</Link>
      <div className="navbar-links">
        {currentUser ? (
          <>
            <Link to="/vehicle">View Car</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/profile">Profile</Link>
            <button className="navbar-logout" onClick={handleLogout}>Log Out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log In</Link>
            <Link to="/signup" className="navbar-signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}