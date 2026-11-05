/**
 * authcookie.js — کوکی سشن امضاشده برای ورود ادمین (پورت auth.py با Web Crypto)
 */

const SESSION_TTL = 60 * 60 * 12; // 12h

function toBase64Url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bytesToHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSessionCookie(username, secret) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL;
  const payload = `${username}:${expires}`;
  const key = await hmacKey(secret);
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const sig = bytesToHex(new Uint8Array(sigBuf));
  const token = `${payload}:${sig}`;
  return toBase64Url(new TextEncoder().encode(token));
}

export async function verifySessionCookie(cookieValue, secret) {
  try {
    const tokenBytes = fromBase64Url(cookieValue);
    const token = new TextDecoder().decode(tokenBytes);
    const lastColon = token.lastIndexOf(":");
    const secondLastColon = token.lastIndexOf(":", lastColon - 1);
    if (lastColon < 0 || secondLastColon < 0) return false;

    const username = token.slice(0, secondLastColon);
    const expires = token.slice(secondLastColon + 1, lastColon);
    const sig = token.slice(lastColon + 1);

    const key = await hmacKey(secret);
    const expectedBuf = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${username}:${expires}`)
    );
    const expectedSig = bytesToHex(new Uint8Array(expectedBuf));

    if (expectedSig.length !== sig.length) return false;
    let diff = 0;
    for (let i = 0; i < expectedSig.length; i++) {
      diff |= expectedSig.charCodeAt(i) ^ sig.charCodeAt(i);
    }
    if (diff !== 0) return false;

    return parseInt(expires, 10) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = v;
  }
  return out;
}
