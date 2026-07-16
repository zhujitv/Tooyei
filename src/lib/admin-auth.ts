import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "tooyei_admin_session";
const sessionDurationSeconds = 60 * 60 * 8;

export type AdminSession = {
  email: string;
  expiresAt: number;
};

const getSessionSecret = () => {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
};

const encode = (value: string) => Buffer.from(value).toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const sign = (payload: string) =>
  createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

export async function createAdminSession(email: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
  const payload = encode(JSON.stringify({ email, expiresAt, nonce: randomBytes(16).toString("hex") }));
  const value = `${payload}.${sign(payload)}`;

  const cookieStore = await cookies();
  cookieStore.set(cookieName, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: sessionDurationSeconds,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 0,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return null;

  const [payload, signature, ...rest] = value.split(".");
  if (!payload || !signature || rest.length || !safeEqual(sign(payload), signature)) return null;

  try {
    const session = JSON.parse(decode(payload)) as AdminSession & { nonce?: string };
    if (!session.email || !session.expiresAt || session.expiresAt <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return { email: session.email, expiresAt: session.expiresAt };
  } catch {
    return null;
  }
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
