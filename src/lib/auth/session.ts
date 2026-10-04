import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { COOKIE_SESSION_NAME } from "@/constants";
import { getUserById } from "@/lib/db/user";
import { User } from "@prisma/client";

export type SafeUser = Omit<User, "passwordHash">;

interface SessionPayload {
  userId: string;
  expiresAt: number;
}

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecretKey(): string {
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
function signPayload(payloadStr: string): string {
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
 * Decrypt/Verify session token
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

/**
 * Create session cookie
 */
export async function createSession(userId: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION;
  const token = createToken({ userId, expiresAt });

  const cookieStore = cookies();
  cookieStore.set(COOKIE_SESSION_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

/**
 * Destroy session cookie
 */
export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_SESSION_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

/**
 * Get current authenticated user (server-side)
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_SESSION_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await getUserById(payload.userId);
  if (!user) return null;

  // Sanitize passwordHash before returning to application code
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Require authenticated user or redirect to /login
 */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
