import { useState } from "react";
import { supabase } from "../lib/supabase.js";

function mapError(msg) {
  if (!msg) return "Something went wrong. Please try again.";
  const m = msg.toLowerCase();
  if (
    m.includes("already registered") ||
    m.includes("already exists") ||
    m.includes("email address is already") ||
    m.includes("user already") ||
    m.includes("duplicate")
  ) {
    return "An account with this email already exists. Sign in instead, or use the same method you registered with.";
  }
  if (m.includes("provider is not enabled") || m.includes("oauth")) {
    return "Google sign-in is not configured yet. Please contact the administrator.";
  }
  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return "Incorrect email or password.";
  }
  if (m.includes("email not confirmed")) {
    return "Please verify your email before signing in. Check your inbox (or spam folder).";
  }
  if (m.includes("password should be at least")) {
    return "Password must be at least 8 characters.";
  }
  return msg;
}

export default function AuthPage() {
  const [mode, setMode]         = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [message, setMessage]   = useState(null);

  function validate() {
    if (!email.trim()) { setError("Email is required."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Please enter a valid email address."); return false; }
    if (!password) { setError("Password is required."); return false; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return false; }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null); setMessage(null);
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setMessage("Check your email to verify your account, then sign in. If you don't see it, check your spam folder.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (err) { setError(mapError(err.message)); }
    finally { setLoading(false); }
  }

  async function handleGoogleSignIn() {
    setLoading(true); setError(null); setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      setError(mapError(err.message));
      setLoading(false);
    }
  }

  function switchMode(m) { setMode(m); setError(null); setMessage(null); }

  return (
    <div className="auth-page">
      <div className="auth-bg" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => <span key={i} className="bg-line" style={{ "--i": i }} />)}
      </div>
      <div className="auth-inner">
        <div className="auth-logo">
          <span className="auth-glyph">기리고</span>
          <span className="auth-tagline">Got a wish worth dying for?</span>
        </div>
        <div className="auth-card">
          <div className="mode-toggle">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>Sign in</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>Register</button>
          </div>

          <button
            type="button"
            className="btn-google"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {mode === "login" ? "Sign in with Google" : "Register with Google"}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required disabled={loading} autoComplete="email" />
            </div>
            <div className="form-group">
              <label>Password {mode === "register" && <span className="label-hint">— also seals your wish</span>}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} disabled={loading} autoComplete={mode === "register" ? "new-password" : "current-password"} />
            </div>
            {error   && <div className="form-error">{error}</div>}
            {message && <div className="form-success">{message}</div>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="btn-loading">···</span> : mode === "login" ? "Enter" : "Make a pact"}
            </button>
          </form>
        </div>
        <p className="auth-footnote">Your wish is encrypted with your password before it leaves this device.<br /><strong>No one — not even the server — can read it.</strong></p>
      </div>
    </div>
  );
}
