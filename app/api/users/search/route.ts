import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { validateJWT } from "../../../../lib/auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    // Set CORS headers
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 200 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const limit = searchParams.get("limit");

    // Validate limit parameter
    let limitNumber: number | undefined;
    if (limit) {
      const parsed = parseInt(limit);
      if (isNaN(parsed) || parsed < 1 || parsed > 100) {
        return NextResponse.json(
          { error: "Limit must be a number between 1 and 100" },
          { status: 400 }
        );
      }
      limitNumber = parsed;
    }

    // Get current user from JWT token
    const authHeader = request.headers.get("authorization");
    let currentUserId: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const user = await validateJWT(token);
      if (user) {
        currentUserId = user._id;
      }
    }

    // Search users (query is optional)
    const users = await convex.query(api.users.searchUsers, {
      query: query || undefined,
      limit: limitNumber,
      currentUserId: currentUserId as any,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Search users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
