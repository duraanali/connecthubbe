import { NextRequest, NextResponse } from "next/server";
import { ConvexClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) throw new Error("Convex URL is not set!");
const convex = new ConvexClient(convexUrl);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First check if the user exists
    const user = await convex.query(api.users.getById, {
      id: params.id as Id<"users">,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the list of users being followed
    const following = await convex.query(api.social.getFollowing, {
      userId: params.id as Id<"users">,
    });

    return NextResponse.json(following);
  } catch (error) {
    console.error("Error fetching following list:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
