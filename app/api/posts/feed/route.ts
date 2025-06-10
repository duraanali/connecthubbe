import { NextResponse } from "next/server";
import { ConvexClient } from "convex/browser";
import jwt, { JwtPayload } from "jsonwebtoken";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) throw new Error("Convex URL is not set!");
const convex = new ConvexClient(convexUrl);
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to verify JWT
const verifyToken = (token: string): (JwtPayload & { id: string }) | null => {
  try {
    console.log("Verifying token...");
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & {
      id: string;
    };
    console.log("Token verified successfully. Decoded payload:", decoded);
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", {
      message: error instanceof Error ? error.message : "Unknown error",
      name: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
};

export async function GET(request: Request) {
  console.log("GET /api/posts/feed called");
  try {
    const authHeader = request.headers.get("authorization");
    console.log("Auth header:", authHeader);

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Invalid authorization header format" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    console.log("Decoded token:", decoded);

    const user = await convex.query(api.users.getById, {
      id: decoded.id as Id<"users">,
    });
    if (!user) {
      console.error("User not found for ID:", decoded.id);
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    console.log("Found user:", user);

    try {
      const posts = await convex.query(api.social.getFeed, {
        userId: user._id,
      });

      console.log("Retrieved feed posts:", posts);
      return NextResponse.json(posts);
    } catch (queryError) {
      console.error("Convex query error:", {
        error: queryError,
        message:
          queryError instanceof Error ? queryError.message : "Unknown error",
        stack: queryError instanceof Error ? queryError.stack : undefined,
      });
      throw queryError;
    }
  } catch (error) {
    console.error("Get feed error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
