import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface JWTPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
}

export async function getAuthUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) {
    throw new Error("No token provided");
  }
  return verifyToken(token);
}

export function authMiddleware(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      const user = await getAuthUser(req);
      return handler(req, user, ...args);
    } catch (error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  };
}

export function setAuthCookie(token: string) {
  cookies().set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearAuthCookie() {
  cookies().delete("token");
}
