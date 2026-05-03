import { supabase } from "./supabase.js";

const BASE = import.meta.env.VITE_BACKEND_URL;

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` };
}

async function request(path, options = {}) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const postWish = (payload) =>
  request("/api/wishes", { method: "POST", body: JSON.stringify(payload) });

export const getActiveWish = () =>
  request("/api/wishes/active").then((d) => d.wish);

export const getVapidPublicKey = () =>
  request("/api/push/vapid-public-key").then((d) => d.key);

export const savePushSubscription = (subscription) =>
  request("/api/push/subscribe", { method: "POST", body: JSON.stringify({ subscription }) });

export const deletePushSubscription = (endpoint) =>
  request("/api/push/subscribe", { method: "DELETE", body: JSON.stringify({ endpoint }) });