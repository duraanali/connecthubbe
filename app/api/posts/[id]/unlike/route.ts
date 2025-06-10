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
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & {
      id: string;
    };
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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
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

    const user = await convex.query(api.users.getById, {
      id: decoded.id as Id<"users">,
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    try {
      await convex.mutation(api.social.unlike, {
        postId: params.id as Id<"posts">,
        userId: user._id,
      });

      return NextResponse.json({ success: true });
    } catch (mutationError) {
      console.error("Convex mutation error:", {
        error: mutationError,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Unknown error",
        stack: mutationError instanceof Error ? mutationError.stack : undefined,
      });
      throw mutationError;
    }
  } catch (error) {
    console.error("Unlike post error:", {
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
