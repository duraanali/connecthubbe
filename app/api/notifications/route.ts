import { NextRequest, NextResponse } from "next/server";
import { ConvexClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Id } from "../../../convex/_generated/dataModel";

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

// GET /api/notifications - Get all notifications for the current user
export async function GET(request: NextRequest) {
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

    // Get notifications for the user
    const notifications = await convex.query(
      api.notifications.getNotifications,
      {
        userId: user._id,
      }
    );

    const response = NextResponse.json(notifications);
    addCorsHeaders(response);
    return response;
  } catch (error) {
    console.error("Get notifications error:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    addCorsHeaders(response);
    return response;
  }
}

// POST /api/notifications - Create a new notification (internal use)
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { user_id, sender_id, type, message, reference_id } = body;

    // Validate required fields
    if (!user_id || !sender_id || !type || !message) {
      const response = NextResponse.json(
        { error: "user_id, sender_id, type, and message are required" },
        { status: 400 }
      );
      addCorsHeaders(response);
      return response;
    }

    // Validate notification type
    const validTypes = ["follow", "like", "comment"];
    if (!validTypes.includes(type)) {
      const response = NextResponse.json(
        { error: "Type must be 'follow', 'like', or 'comment'" },
        { status: 400 }
      );
      addCorsHeaders(response);
      return response;
    }

    // Create notification
    const notification = await convex.mutation(
      api.notifications.createNotification,
      {
        userId: user_id as Id<"users">,
        senderId: sender_id as Id<"users">,
        type,
        message,
        referenceId: reference_id,
      }
    );

    const response = NextResponse.json(notification, { status: 201 });
    addCorsHeaders(response);
    return response;
  } catch (error) {
    console.error("Create notification error:", error);
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
