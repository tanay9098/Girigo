import { supabase } from "./supabase.js";

const BASE = import.meta.env.VITE_BACKEND_URL;

async function authHeaders(includeContentType = true) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const headers = { Authorization: `Bearer ${session.access_token}` };
  if (includeContentType) headers["Content-Type"] = "application/json";
  return headers;
}

async function request(path, options = {}) {
  const headers = await authHeaders(!options.isMultipart);
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

/**
 * Upload encrypted video wish.
 * @param {ArrayBuffer} encryptedBuffer  encrypted video bytes
 * @param {string} iv    base64
 * @param {string} salt  base64
 */
export async function postWishVideo({ encryptedBuffer, iv, salt }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const formData = new FormData();
  // Send encrypted bytes as binary blob
  formData.append("video", new Blob([encryptedBuffer], { type: "application/octet-stream" }), "wish.bin");
  formData.append("iv", iv);
  formData.append("salt", salt);

  const res = await fetch(`${BASE}/api/wishes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    // Do NOT set Content-Type — browser sets it automatically with boundary for multipart
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const getActiveWish = () =>
  request("/api/wishes/active").then((d) => d.wish);

export const getVapidPublicKey = () =>
  request("/api/push/vapid-public-key").then((d) => d.key);

export const savePushSubscription = (subscription) =>
  request("/api/push/subscribe", { method: "POST", body: JSON.stringify({ subscription }) });

export const deletePushSubscription = (endpoint) =>
  request("/api/push/subscribe", { method: "DELETE", body: JSON.stringify({ endpoint }) });