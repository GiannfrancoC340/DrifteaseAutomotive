import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { generateUserId } from "../lib/generateId";
import "./Signup.css";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  // Password validation function
  const validatePassword = (pass: string): string[] => {
    const errors = []
    
    if (pass.length < 8) {
      errors.push('At least 8 characters')
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      errors.push('At least 1 special character (!@#$%^&*)')
    }
    
    if (!/[A-Z]/.test(pass)) {
      errors.push('At least 1 uppercase letter')
    }
    
    if (!/[a-z]/.test(pass)) {
      errors.push('At least 1 lowercase letter')
    }
    
    if (!/[0-9]/.test(pass)) {
      errors.push('At least 1 number')
    }
    
    return errors
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Password must have: ${passwordErrors.join(", ")}`);
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName });

      // Create a user profile document in Firestore
      const customUserId = await generateUserId();

      await setDoc(doc(db, "users", user.uid), {
        customUserId,
        fullName,
        email,
        role: "renter",
        createdAt: new Date().toISOString(),
      });

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create an account");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      // Create a Firestore profile if this is their first time signing in
      const customUserId = await generateUserId();

      await setDoc(doc(db, "users", user.uid), {
        customUserId,
        fullName: user.displayName || "",
        email: user.email,
        role: "renter",
        createdAt: new Date().toISOString(),
      });
  
      navigate("/dashboard");
    } catch (err: any) {
      setError("Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        {error && <p className="error-message">{error}</p>}

        <label htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {/* Password Requirements Display */}
        {password.length > 0 && (
              <div className="password-requirements">
                <p className="requirements-title">Password must contain:</p>
                <ul>
                  <li className={password.length >= 8 ? 'requirement-met' : 'requirement-unmet'}>
                    {password.length >= 8 ? '✓' : '○'} At least 8 characters
                  </li>
                  <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'requirement-met' : 'requirement-unmet'}>
                    {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✓' : '○'} At least 1 special character (!@#$%^&*)
                  </li>
                  <li className={/[A-Z]/.test(password) ? 'requirement-met' : 'requirement-unmet'}>
                    {/[A-Z]/.test(password) ? '✓' : '○'} At least 1 uppercase letter
                  </li>
                  <li className={/[a-z]/.test(password) ? 'requirement-met' : 'requirement-unmet'}>
                    {/[a-z]/.test(password) ? '✓' : '○'} At least 1 lowercase letter
                  </li>
                  <li className={/[0-9]/.test(password) ? 'requirement-met' : 'requirement-unmet'}>
                    {/[0-9]/.test(password) ? '✓' : '○'} At least 1 number
                  </li>
                </ul>
              </div>
            )}

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <div className="divider">or</div>

        <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="google-btn">
          Continue with Google
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}