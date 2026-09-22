/**
 * Auth primitives for the BLAST backend.
 *
 * Implemented with Node's built-in `crypto` only — no external auth deps — so
 * the API runs anywhere. Two pieces:
 *   - password hashing via scrypt (salted, constant-time verify)
 *   - stateless session tokens via HMAC-signed JWT-style tokens
 *
 * In production, set AUTH_SECRET to a long random value. The token format is
 * the standard `base64url(header).base64url(payload).base64url(signature)`.
 */
import crypto from "node:crypto";

const SECRET = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";
const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24h

// --- password hashing ----------------------------------------------------

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password, stored) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expected, "hex");
  // constant-time compare; lengths must match for timingSafeEqual
  if (derived.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuf);
}

// --- token (JWT-style HS256) ---------------------------------------------

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(data) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function issueToken(payload, ttlSeconds = TOKEN_TTL_SECONDS) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(
    JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds })
  );
  const signature = sign(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token) {
  if (typeof token !== "string") throw new Error("Missing token");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed token");
  const [header, body, signature] = parts;
  const expected = sign(`${header}.${body}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("Bad signature");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error("Token expired");
  }
  return payload;
}

/** Express middleware: requires a valid Bearer token, attaches req.user. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    res.status(401).json({ error: `Unauthorized: ${err.message}` });
  }
}
