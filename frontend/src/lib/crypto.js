/**
 * Client-side AES-256-GCM encryption using the Web Crypto API.
 * Works for both text (wish) and binary (video blob).
 * Key is derived from user's password using PBKDF2 (310,000 iterations).
 */

const ALGO = "AES-GCM";
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 310_000;

function toBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: ALGO, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a video Blob in the browser.
 * @param {Blob} videoBlob    Recorded video blob from MediaRecorder
 * @param {string} password   User's password
 * @returns {{ encryptedBuffer: ArrayBuffer, iv: string, salt: string }}
 */
export async function encryptVideo(videoBlob, password) {
  const salt      = crypto.getRandomValues(new Uint8Array(16));
  const iv        = crypto.getRandomValues(new Uint8Array(12));
  const key       = await deriveKey(password, salt);
  const videoData = await videoBlob.arrayBuffer(); // Blob → ArrayBuffer

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGO, iv }, key, videoData
  );

  return {
    encryptedBuffer, // ArrayBuffer — send as binary
    iv:   toBase64(iv),
    salt: toBase64(salt),
  };
}

/**
 * Decrypt a video back to a Blob (for user playback only).
 * @param {ArrayBuffer} encryptedBuffer
 * @param {string} iv     base64
 * @param {string} salt   base64
 * @param {string} password
 * @returns {Blob} playable video blob
 */
export async function decryptVideo(encryptedBuffer, iv, salt, password) {
  const key = await deriveKey(password, fromBase64(salt));
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGO, iv: fromBase64(iv) }, key, encryptedBuffer
  );
  return new Blob([decrypted], { type: "video/webm" });
}
