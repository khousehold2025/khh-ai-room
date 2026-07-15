import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "khh_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8시간

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET 환경변수가 없습니다.");
  }

  return secret;
}

function createSignature(value: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("hex");
}

export function createAdminSessionToken() {
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const payload = String(expiresAt);
  const signature = createSignature(payload);

  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token?: string) {
  if (!token) return false;

  const [expiresAtText, signature] = token.split(".");

  if (!expiresAtText || !signature) return false;

  const expiresAt = Number(expiresAtText);

  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const expectedSignature = createSignature(expiresAtText);

  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  return verifyAdminSessionToken(token);
}

export const adminCookieOptions = {
  name: COOKIE_NAME,
  maxAge: SESSION_DURATION_SECONDS,
};