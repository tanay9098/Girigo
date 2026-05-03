import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { getActiveWish } from "../lib/api.js";
import WishForm from "../components/WishForm.jsx";
import CountDown from "../components/CountDown.jsx";
import PushPrompt from "../components/PushPrompt.jsx";
import GrantedScreen from "../components/GrantedScreen.jsx";

export default function DashboardPage() {
  const [wish, setWish]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [granted, setGranted]     = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    getActiveWish()
      .then((w) => { setWish(w); if (w?.is_granted) setGranted(true); })
      .catch((e) => setFetchError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (granted) return <GrantedScreen />;
  if (loading)  return <div className="page-loading"><span className="loading-glyph">기리고</span></div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <span className="header-glyph">기리고</span>
        <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>Leave</button>
      </header>
      <main className="dashboard-main">
        {fetchError && <div className="form-error">{fetchError}</div>}
        {wish && !wish.is_granted ? (
          <div className="active-wish-view">
            <p className="active-wish-label">Wish submitted</p>
            <CountDown expiresAt={wish.expires_at} onExpired={() => setGranted(true)} />
            <PushPrompt />
            <div className="wish-seal-note">🔒 Your wish is sealed. No one can read it — not even us.</div>
          </div>
        ) : (
          <div className="no-wish-view">
            <WishForm onWishMade={(w) => setWish(w)} />
            <PushPrompt />
          </div>
        )}
      </main>
    </div>
  );
}