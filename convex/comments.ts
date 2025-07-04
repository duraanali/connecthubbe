import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
    text: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const commentId = await ctx.db.insert("comments", {
      userId: args.userId,
      postId: args.postId,
      text: args.text,
      createdAt: args.createdAt,
    });
    return commentId;
  },
});

export const getByPost = query({
  args: {
    postId: v.id("posts"),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("desc")
      .take(limit);

    // Get user info for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          text: comment.text || "",
          user: {
            id: user?._id || "",
            name: user?.name || "",
            email: user?.email || "",
            avatarUrl: user?.avatarUrl || "",
          },
        };
      })
    );

    return {
      comments: commentsWithUsers,
      cursor:
        comments.length === limit ? comments[comments.length - 1]._id : null,
    };
  },
});

export const remove = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.id);
    if (!comment) throw new Error("Comment not found");
    await ctx.db.delete(args.id);
  },
});
