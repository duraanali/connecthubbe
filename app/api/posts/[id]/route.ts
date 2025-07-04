import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "../../../auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Id } from "@/convex/_generated/dataModel";

const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) throw new Error("Convex URL is not set!");
const convex = new ConvexHttpClient(convexUrl);
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

async function getHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await convex.query(api.social.getPost, {
      postId: id as Id<"posts">,
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("DELETE /api/posts/[id] called");
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization");
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
    console.log("Post ID:", id);

    const post = await convex.query(api.social.getPost, {
      postId: id as Id<"posts">,
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.userId !== user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
      await convex.mutation(api.social.deletePost, {
        postId: id as Id<"posts">,
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
    console.error("Delete post error:", {
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

export const GET = getHandler;
export const DELETE = deleteHandler;
