import { useState } from "react";
import { encryptWish } from "../lib/crypto.js";
import { postWish } from "../lib/api.js";

const MAX = 280;

export default function WishForm({ onWishMade }) {
  const [wish, setWish]       = useState("");
  const [pass, setPass]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const match    = pass === confirm;
  const canSubmit = agreed && wish.trim() && match && pass.length >= 8 && !loading;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true); setError(null);
    try {
      const { encryptedWish, iv, salt } = await encryptWish(wish, pass);
      const result = await postWish({ encrypted_wish: encryptedWish, iv, salt });
      onWishMade(result);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="wish-form-container">
      <div className="wish-form-header">
        <span className="wish-icon">🕯️</span>
        <h2>Make your wish</h2>
        <p>Speak it clearly. The app is listening.</p>
      </div>

      <form className="wish-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label>Your wish <span className={`char-count ${MAX - wish.length < 40 ? "char-count--warn" : ""}`}>{MAX - wish.length} left</span></label>
          <textarea value={wish} onChange={(e) => setWish(e.target.value.slice(0, MAX))} placeholder="I wish that..." rows={4} required disabled={loading} />
        </div>

        <div className="form-group">
          <label>Seal password <span className="label-hint">— encrypts your wish locally</span></label>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Min 8 characters" required minLength={8} disabled={loading} autoComplete="new-password" />
          <p className="field-hint">Encrypted before leaving your device. <strong>Don't lose this password.</strong></p>
        </div>

        <div className="form-group">
          <label>Confirm password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" required disabled={loading} autoComplete="new-password" className={confirm && !match ? "input-error" : ""} />
          {confirm && !match && <p className="field-error">Passwords do not match</p>}
        </div>

        <label className="confirm-check">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={loading} />
          <span>I understand — once submitted this cannot be undone. The 24-hour countdown begins immediately.</span>
        </label>

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="btn-primary" disabled={!canSubmit}>
          {loading ? <span className="btn-loading">sealing wish···</span> : "Submit the wish"}
        </button>
      </form>
    </div>
  );
}