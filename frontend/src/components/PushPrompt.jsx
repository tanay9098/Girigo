import { usePushNotifications } from "../hooks/usePush.js";

export default function PushPrompt() {
  const { isSupported, permission, subscription, loading, error, subscribe } = usePushNotifications();

  if (!isSupported) return null;
  if (subscription) return (
    <div className="push-status push-status--active">
      <span className="push-dot" />You'll be notified when your wish is granted
    </div>
  );
  if (permission === "denied") return (
    <div className="push-status push-status--blocked">🔕 Notifications blocked — enable in browser settings</div>
  );

  return (
    <div className="push-prompt">
      <p>Allow notifications so we can tell you the moment your wish is granted.</p>
      {error && <div className="form-error">{error}</div>}
      <button className="btn-secondary" onClick={subscribe} disabled={loading}>
        {loading ? "···" : "Enable notifications"}
      </button>
    </div>
  );
}