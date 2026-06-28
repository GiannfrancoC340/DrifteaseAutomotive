import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate("/");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">Driftease</Link>
      <div className="navbar-links">
        <Link to="/vehicle">View Car</Link>
        {currentUser ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
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