import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "../../../../../auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function handler(
  req: NextRequest,
  user: any,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const comment = await convex.query(api.social.getComment, {
      commentId: params.commentId,
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.userId !== user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await convex.mutation(api.social.deleteComment, {
      commentId: params.commentId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const DELETE = authMiddleware(handler);
