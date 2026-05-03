import { useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function AuthPage() {
  const [mode, setMode]         = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [message, setMessage]   = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null); setMessage(null);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email to confirm, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
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