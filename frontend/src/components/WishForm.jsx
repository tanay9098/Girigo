import { useState } from "react";
import { encryptVideo } from "../lib/crypto.js";
import { postWishVideo } from "../lib/api.js";
import VideoRecorder from "./VideoRecorder.jsx";

export default function WishForm({ onWishMade }) {
  const [videoBlob, setVideoBlob]     = useState(null); // confirmed recording
  const [password, setPassword]       = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [agreed, setAgreed]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [step, setStep]               = useState("record"); // "record" | "confirm"

  const match     = password === confirmPassword;
  const canSubmit = agreed && videoBlob && match && password.length >= 8 && !loading;

  function handleVideoReady(blob) {
    setVideoBlob(blob);
    setStep("confirm");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      // Encrypt video entirely in browser — server never sees raw footage
      const { encryptedBuffer, iv, salt } = await encryptVideo(videoBlob, password);
      const result = await postWishVideo({ encryptedBuffer, iv, salt });
      onWishMade(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wish-form-container">
      <div className="wish-form-header">
        <span className="wish-icon">🕯️</span>
        <h2>Make your wish</h2>
        <p>Record it clearly. The app is watching.</p>
      </div>

      {/* Step 1 — record video */}
      {step === "record" && (
        <div className="wish-form">
          <VideoRecorder onVideoReady={handleVideoReady} />
        </div>
      )}

      {/* Step 2 — password + submit */}
      {step === "confirm" && (
        <form className="wish-form" onSubmit={handleSubmit} noValidate>

          <div className="video-confirmed">
            ✓ Recording saved — {(videoBlob.size / (1024 * 1024)).toFixed(1)} MB
            <button
              type="button"
              className="btn-ghost"
              onClick={() => { setVideoBlob(null); setStep("record"); }}
            >
              Re-record
            </button>
          </div>

          <div className="form-group">
            <label>
              Seal password
              <span className="label-hint"> — encrypts your video locally</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              minLength={8}
              disabled={loading}
              autoComplete="new-password"
            />
            <p className="field-hint">
              Your video is encrypted with this password before it leaves your device.
              <strong> Don't lose this password.</strong>
            </p>
          </div>

          <div className="form-group">
            <label>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              required
              disabled={loading}
              autoComplete="new-password"
              className={confirmPassword && !match ? "input-error" : ""}
            />
            {confirmPassword && !match && (
              <p className="field-error">Passwords do not match</p>
            )}
          </div>

          <label className="confirm-check">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={loading}
            />
            <span>
              I understand — once submitted this cannot be undone.
              The 24-hour countdown begins immediately.
            </span>
          </label>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={!canSubmit}>
            {loading
              ? <span className="btn-loading">encrypting & uploading···</span>
              : "Submit the wish"}
          </button>
        </form>
      )}
    </div>
  );
}