import { NextRequest, NextResponse } from "next/server";
import { ConvexClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Id } from "../../../../../convex/_generated/dataModel";

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

// PUT /api/notifications/:id/read - Mark a single notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from Authorization header
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

    // Get user from database
    const user = await convex.query(api.users.getById, {
      id: decoded.id as Id<"users">,
    });
    if (!user) {
      const response = NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
      addCorsHeaders(response);
      return response;
    }

    // Parse request body
    const body = await request.json();
    const { is_read } = body;

    if (is_read !== true) {
      const response = NextResponse.json(
        { error: "is_read must be true" },
        { status: 400 }
      );
      addCorsHeaders(response);
      return response;
    }

    // Mark notification as read
    const result = await convex.mutation(
      api.notifications.markNotificationAsRead,
      {
        notificationId: params.id as Id<"notifications">,
        userId: user._id,
      }
    );

    const response = NextResponse.json(result);
    addCorsHeaders(response);
    return response;
  } catch (error) {
    console.error("Mark notification as read error:", error);
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
