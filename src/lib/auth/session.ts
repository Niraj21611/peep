import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESSION_NAME } from "@/constants";
import { getUserById } from "@/lib/db/user";
import { User } from "@prisma/client";
import { createToken, verifyToken, SESSION_DURATION } from "./token";

export type SafeUser = Omit<User, "passwordHash">;

export { createToken, verifyToken };

/**
 * Create session cookie
 */
export async function createSession(userId: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION;
  const token = createToken({ userId, expiresAt });

const cookieStore = await cookies();
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
const cookieStore = await cookies();
  cookieStore.set(COOKIE_SESSION_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

/**
 * Get current authenticated user (server-side, database backed)
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
const cookieStore = await cookies();  const token = cookieStore.get(COOKIE_SESSION_NAME)?.value;
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
