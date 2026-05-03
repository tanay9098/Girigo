import { useCountdown } from "../hooks/useCountdown.js";

const pad = (n) => String(n).padStart(2, "0");

export default function CountDown({ expiresAt, onExpired }) {
  const t = useCountdown(expiresAt);

  if (!t) return <div className="countdown"><div className="countdown-loading">· · ·</div></div>;
  if (t.expired) { onExpired?.(); return null; }

  const urgency = t.raw < 3_600_000 ? "critical" : t.raw < 21_600_000 ? "urgent" : "normal";

  return (
    <div className={`countdown countdown--${urgency}`} aria-live="polite">
      <div className="countdown-label">Time remaining</div>
      <div className="countdown-digits">
        <div className="digit-group"><span className="digit">{pad(t.hours)}</span><span className="digit-label">HRS</span></div>
        <span className="countdown-sep">:</span>
        <div className="digit-group"><span className="digit">{pad(t.minutes)}</span><span className="digit-label">MIN</span></div>
        <span className="countdown-sep">:</span>
        <div className="digit-group"><span className="digit">{pad(t.seconds)}</span><span className="digit-label">SEC</span></div>
      </div>
      {urgency !== "normal" && (
        <div className="countdown-bar-wrap">
          <div className="countdown-bar" style={{ width: `${(t.raw / 86_400_000) * 100}%` }} />
        </div>
      )}
      {urgency === "critical" && <div className="countdown-warning" role="alert">The end is near</div>}
    </div>
  );
}