import jwt from "jsonwebtoken";

export interface JwtPayload {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_TTL = "7d";
export const JWT_COOKIE = "auth_token";
export const JWT_COOKIE_TTL = 7 * 24 * 60 * 60 * 1000;

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_TTL });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
