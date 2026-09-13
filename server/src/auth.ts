import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";

const scrypt = promisify(scryptCallback);
const secret = process.env.AUTH_SECRET ?? "change-this-working-place-secret-in-production";

export type SessionUser = { id: string; name: string; email: string; avatar: string; color: string };

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const key = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return expected.length === key.length && timingSafeEqual(expected, key);
}

export function createToken(user: SessionUser) {
  return jwt.sign(user, secret, { expiresIn: "7d" });
}

export function readToken(token?: string): SessionUser | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret) as SessionUser;
    return { id: payload.id, name: payload.name, email: payload.email, avatar: payload.avatar, color: payload.color };
  } catch { 
    return null; 
  }
}
