import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="page">
      <h1>Driftease Automotive</h1>
      <p>Book the car directly, no platform fees.</p>
      <div className="home-actions">
        <Link to="/login">Log In</Link>
        <Link to="/signup">Sign Up</Link>
      </div>
    </div>
  );
}