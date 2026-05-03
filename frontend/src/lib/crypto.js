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

export async function encryptWish(wish, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGO, iv }, key, new TextEncoder().encode(wish)
  );
  return { encryptedWish: toBase64(ciphertext), iv: toBase64(iv), salt: toBase64(salt) };
}

export async function decryptWish(encryptedWish, iv, salt, password) {
  const key = await deriveKey(password, fromBase64(salt));
  const plaintext = await crypto.subtle.decrypt(
    { name: ALGO, iv: fromBase64(iv) }, key, fromBase64(encryptedWish)
  );
  return new TextDecoder().decode(plaintext);
}