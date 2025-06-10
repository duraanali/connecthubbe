import { NextRequest, NextResponse } from "next/server";
import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import jwt from "jsonwebtoken";

const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) throw new Error("Convex URL is not set!");
const convex = new ConvexClient(convexUrl);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // In production, use a proper secret key

export function generateToken(user: {
  id: Id<"users">;
  email: string;
  name: string;
}): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function setAuthCookie(
  response: NextResponse,
  token: string
): NextResponse {
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
  return response;
}

export async function authMiddleware(
  handler: (req: NextRequest, user: any, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      const token = req.headers.get("authorization")?.split(" ")[1];

      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          id: string;
          email: string;
          name: string;
        };
        const user = await convex.query(api.users.getById, {
          id: decoded.id as Id<"users">,
        });

        if (!user) {
          return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        return handler(req, user, context);
      } catch (error) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    } catch (error) {
      console.error("Auth error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
