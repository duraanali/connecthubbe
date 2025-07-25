import { NextRequest, NextResponse } from "next/server";
import { ConvexClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Id } from "../../../../convex/_generated/dataModel";

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
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & {
      id: string;
    };
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};

// GET /api/auth/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

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

    const user = await convex.query(api.users.getById, {
      id: decoded.id as Id<"users">,
    });

    if (!user) {
      const response = NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
      addCorsHeaders(response);
      return response;
    }

    // Return user profile without sensitive information
    const profile = {
      id: user._id,
      name: user.name || "",
      email: user.email || "",
      avatarUrl: user.avatarUrl || "",
      bio: user.bio || "",
      createdAt: user.createdAt,
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      postsCount: user.postsCount || 0,
      recentPosts: user.recentPosts || [],
    };

    const response = NextResponse.json(profile);
    addCorsHeaders(response);
    return response;
  } catch (error) {
    console.error("Get profile error:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    addCorsHeaders(response);
    return response;
  }
}

// PUT /api/auth/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

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

    // Parse request body
    const body = await request.json();
    const { name, avatarUrl, bio, storageId } = body;

    // Validate input
    if (!name && !avatarUrl && bio === undefined && !storageId) {
      const response = NextResponse.json(
        {
          error:
            "At least one field (name, avatarUrl, bio, or storageId) is required",
        },
        { status: 400 }
      );
      addCorsHeaders(response);
      return response;
    }

    // Prepare update object
    const updates: { name?: string; avatarUrl?: string; bio?: string } = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;

    // Handle file upload if storageId is provided
    if (storageId) {
      try {
        const fileInfo = await convex.mutation(api.files.saveFile, {
          storageId: storageId as Id<"_storage">,
          type: "profile",
        });
        updates.avatarUrl = fileInfo.url;
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
    } else if (avatarUrl !== undefined) {
      updates.avatarUrl = avatarUrl;
    }

    // Update user profile
    const updatedUser = await convex.mutation(api.users.update, {
      id: decoded.id as Id<"users">,
      ...updates,
    });

    if (!updatedUser) {
      const response = NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
      addCorsHeaders(response);
      return response;
    }

    // Get updated user with all counts
    const userWithCounts = await convex.query(api.users.getById, {
      id: decoded.id as Id<"users">,
    });

    if (!userWithCounts) {
      const response = NextResponse.json(
        { error: "Failed to fetch updated profile" },
        { status: 500 }
      );
      addCorsHeaders(response);
      return response;
    }

    // Return updated profile without sensitive information
    const profile = {
      id: userWithCounts._id,
      name: userWithCounts.name || "",
      email: userWithCounts.email || "",
      avatarUrl: userWithCounts.avatarUrl || "",
      bio: userWithCounts.bio || "",
      createdAt: userWithCounts.createdAt,
      followersCount: userWithCounts.followersCount || 0,
      followingCount: userWithCounts.followingCount || 0,
      postsCount: userWithCounts.postsCount || 0,
      recentPosts: userWithCounts.recentPosts || [],
    };

    const response = NextResponse.json(profile);
    addCorsHeaders(response);
    return response;
  } catch (error) {
    console.error("Update profile error:", error);
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
