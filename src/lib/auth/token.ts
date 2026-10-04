import crypto from "crypto";
import { COOKIE_SESSION_NAME } from "@/constants";

export interface SessionPayload {
  userId: string;
  expiresAt: number;
}

export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getSecretKey(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET environment variable is missing in production!");
    }
    return "development-fallback-secret-at-least-32-chars-long";
  }
  return secret;
}

/**
 * Sign session payload using HMAC-SHA256
 */
export function signPayload(payloadStr: string): string {
  return crypto.createHmac("sha256", getSecretKey()).update(payloadStr).digest("hex");
}

/**
 * Encrypt/Encode session token payload
 */
export function createToken(payload: SessionPayload): string {
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(payloadStr);
  return `${payloadStr}.${signature}`;
}

/**
 * Decrypt/Verify session token (Edge-safe, zero database dependencies)
 */
export function verifyToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadStr, signature] = parts;
    if (!payloadStr || !signature) return null;

    const expectedSignature = signPayload(payloadStr);

    // Constant time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    const jsonStr = Buffer.from(payloadStr, "base64url").toString("utf-8");
    const payload: SessionPayload = JSON.parse(jsonStr);

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
