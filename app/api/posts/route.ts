import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "../../auth";
import { ConvexClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Id } from "../../../convex/_generated/dataModel";

console.log("SHEEKO", process.env.NEXT_PUBLIC_CONVEX_URL);
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
}

const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) throw new Error("Convex URL is not set!");
const convex = new ConvexClient(convexUrl);
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to add CORS headers
const addCorsHeaders = (response: NextResponse) => {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
};

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

// POST /api/posts
export async function POST(request: Request) {
  console.log("POST /api/posts called");
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    console.log("Auth header:", authHeader);

    if (!authHeader?.startsWith("Bearer ")) {
      const response = NextResponse.json(
        { error: "Invalid authorization header format" },
        { status: 401 }
      );
      addCorsHeaders(response);
      return response;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      const response = NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
      addCorsHeaders(response);
      return response;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      const response = NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
      addCorsHeaders(response);
      return response;
    }

    console.log("Decoded token:", decoded);

    // Get user from database
    const user = await convex.query(api.users.getById, {
      id: decoded.id as Id<"users">,
    });
    if (!user) {
      console.error("User not found for ID:", decoded.id);
      const response = NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
      addCorsHeaders(response);
      return response;
    }

    console.log("Found user:", user);

    // Parse request body
    const body = await request.json();
    console.log("Request body:", body);

    const { text, image_url, storageId } = body;

    if (!text) {
      const response = NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
      addCorsHeaders(response);
      return response;
    }

    let imageUrl = image_url;

    // Handle file upload if storageId is provided
    if (storageId) {
      try {
        const fileInfo = await convex.mutation(api.files.saveFile, {
          storageId: storageId as Id<"_storage">,
          type: "post",
        });
        imageUrl = fileInfo.url;
      } catch (error) {
        const response = NextResponse.json(
          {
            error:
              error instanceof Error ? error.message : "Failed to save image",
          },
          { status: 400 }
        );
        addCorsHeaders(response);
        return response;
      }
    }

    console.log("Creating post with:", {
      userId: user._id,
      text,
      imageUrl: imageUrl,
    });

    try {
      const post = await convex.mutation(api.social.createPost, {
        userId: user._id,
        text,
        imageUrl: imageUrl,
      });

      console.log("Created post:", post);
      const response = NextResponse.json(post, { status: 201 });
      addCorsHeaders(response);
      return response;
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
    console.error("Create post error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    const response = NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
    addCorsHeaders(response);
    return response;
  }
}

// GET /api/posts
export async function GET(request: Request) {
  try {
    // Try to get user ID from authorization header if present
    let userId: Id<"users"> | undefined;
    const authHeader = request.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          const user = await convex.query(api.users.getById, {
            id: decoded.id as Id<"users">,
          });
          if (user) {
            userId = user._id;
          }
        }
      }
    }

    // Get all posts with user information (no authentication required for public posts)
    const posts = await convex.query(api.social.getAllPosts, {
      userId,
    });

    const response = NextResponse.json(posts);
    addCorsHeaders(response);
    return response;
  } catch (error) {
    console.error("Get posts error:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    addCorsHeaders(response);
    return response;
  }
}

// Add OPTIONS handler for preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
