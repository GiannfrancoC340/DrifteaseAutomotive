import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Vehicle.css";

interface VehicleData {
  make: string;
  model: string;
  year: number;
  color: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  seats: number;
  dailyRate: number;
  weeklyRate: number;
  description: string;
  features: string[];
  rules: string[];
  insurance: string;
  images: string[];
  available: boolean;
}

type DateRange = [Date | null, Date | null];

export default function Vehicle() {
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange>([null, null]);
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Placeholder blocked dates (will come from Firestore bookings + iCal later)
  const blockedDates = [
    new Date(2026, 6, 10),
    new Date(2026, 6, 11),
    new Date(2026, 6, 12),
    new Date(2026, 6, 20),
    new Date(2026, 6, 21),
  ];

  useEffect(() => {
    async function fetchVehicle() {
      try {
        const docRef = doc(db, "vehicles", "car1");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setVehicle(docSnap.data() as VehicleData);
        }
      } catch (err) {
        console.error("Error fetching vehicle:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVehicle();
  }, []);

  useEffect(() => {
    if (dateRange[0] && dateRange[1] && vehicle) {
      const start = dateRange[0];
      const end = dateRange[1];
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const total = days >= 7
        ? Math.floor(days / 7) * vehicle.weeklyRate + (days % 7) * vehicle.dailyRate
        : days * vehicle.dailyRate;
      setTotalPrice(total);
    } else {
      setTotalPrice(null);
    }
  }, [dateRange, vehicle]);

  function isTileDisabled({ date }: { date: Date }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    return blockedDates.some(
      (blocked) => blocked.toDateString() === date.toDateString()
    );
  }

  function tileClassName({ date }: { date: Date }) {
    const isBlocked = blockedDates.some(
      (blocked) => blocked.toDateString() === date.toDateString()
    );
    return isBlocked ? "blocked-date" : null;
  }

  function handleBookNow() {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (!dateRange[0] || !dateRange[1]) {
      alert("Please select a date range first");
      return;
    }
    // Navigate to booking page (we'll build this next)
    navigate("/book", {
      state: {
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString(),
        totalPrice,
      },
    });
  }

  if (loading) return <div className="page-loading">Loading vehicle info...</div>;
  if (!vehicle) return <div className="page-loading">Vehicle not found.</div>;

  const [startDate, endDate] = dateRange;

  return (
    <div className="vehicle-page">

      {/* Gallery */}
      <div className="gallery">
        <img
          src={vehicle.images[activeImage]}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="gallery-main"
        />
        <div className="gallery-thumbs">
          {vehicle.images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`View ${i + 1}`}
              className={`gallery-thumb ${i === activeImage ? "active" : ""}`}
              onClick={() => setActiveImage(i)}
            />
          ))}
        </div>
      </div>

      <div className="vehicle-content">

        {/* Left column */}
        <div className="vehicle-details">
          <h1>{vehicle.year} {vehicle.make} {vehicle.model}</h1>
          <p className="vehicle-tagline">{vehicle.description}</p>

          {/* Specs */}
          <div className="specs-grid">
            <div className="spec-item">
              <span className="spec-label">Color</span>
              <span className="spec-value">{vehicle.color}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Mileage</span>
              <span className="spec-value">{vehicle.mileage.toLocaleString()} mi</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Fuel Type</span>
              <span className="spec-value">{vehicle.fuelType}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Transmission</span>
              <span className="spec-value">{vehicle.transmission}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Seats</span>
              <span className="spec-value">{vehicle.seats} passengers</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Daily Rate</span>
              <span className="spec-value">${vehicle.dailyRate}/day</span>
            </div>
          </div>

          {/* Features */}
          <div className="section">
            <h2>Features</h2>
            <ul className="tag-list">
              {vehicle.features.map((f, i) => (
                <li key={i} className="tag">{f}</li>
              ))}
            </ul>
          </div>

          {/* Rules */}
          <div className="section">
            <h2>Rental Rules</h2>
            <ul className="rules-list">
              {vehicle.rules.map((r, i) => (
                <li key={i}>⚠️ {r}</li>
              ))}
            </ul>
          </div>

          {/* Insurance */}
          <div className="section">
            <h2>Insurance</h2>
            <p>{vehicle.insurance}</p>
          </div>
        </div>

        {/* Right column — booking panel */}
        <div className="booking-panel">
          <div className="pricing-header">
            <span className="daily-rate">${vehicle.dailyRate}<span>/day</span></span>
            <span className="weekly-rate">or ${vehicle.weeklyRate}/week</span>
          </div>

          <div className="availability-badge">
            {vehicle.available ? "✅ Available" : "❌ Unavailable"}
          </div>

          <h3>Select Dates</h3>
          <Calendar
            selectRange
            onChange={(value) => setDateRange(value as DateRange)}
            value={dateRange}
            tileDisabled={isTileDisabled}
            tileClassName={tileClassName}
            minDate={new Date()}
          />

          {startDate && endDate && (
            <div className="price-breakdown">
              <div className="price-row">
                <span>Pickup</span>
                <span>{startDate.toLocaleDateString()}</span>
              </div>
              <div className="price-row">
                <span>Return</span>
                <span>{endDate.toLocaleDateString()}</span>
              </div>
              <div className="price-row">
                <span>Days</span>
                <span>
                  {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
              <div className="price-row total">
                <span>Total</span>
                <span>${totalPrice}</span>
              </div>
            </div>
          )}

          <button
            className="book-btn"
            onClick={handleBookNow}
            disabled={!vehicle.available}
          >
            {!currentUser
              ? "Log in to Book"
              : !startDate || !endDate
              ? "Select Dates to Book"
              : "Book Now"}
          </button>

          {!currentUser && (
            <p className="login-note">
              You need to <a href="/login">log in</a> to make a booking.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}