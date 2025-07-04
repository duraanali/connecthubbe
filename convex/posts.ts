import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.id("users"),
    text: v.string(),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const postId = await ctx.db.insert("posts", {
      userId: args.userId,
      text: args.text,
      imageUrl: args.imageUrl,
      createdAt: args.createdAt,
    });
    return postId;
  },
});

export const getById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) return null;

    // Get likes count
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.id))
      .collect();

    // Get comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.id))
      .order("desc")
      .collect();

    // Get user info
    const user = await ctx.db.get(post.userId);

    return {
      ...post,
      text: post.text || "",
      imageUrl: post.imageUrl || "",
      likesCount: likes.length,
      comments,
      user: {
        id: user?._id || "",
        name: user?.name || "",
        email: user?.email || "",
        avatarUrl: user?.avatarUrl || "",
      },
    };
  },
});

export const getFeed = query({
  args: {
    userId: v.id("users"),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get users that the current user follows
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(args.userId); // Include user's own posts

    // Get posts from followed users
    const posts = await ctx.db
      .query("posts")
      .filter((q) => followingIds.some((id) => q.eq(q.field("userId"), id)))
      .order("desc")
      .take(limit);

    // Get user info for each post
    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        const user = await ctx.db.get(post.userId);
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        return {
          ...post,
          text: post.text || "",
          imageUrl: post.imageUrl || "",
          likesCount: likes.length,
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
      posts: postsWithUsers,
      cursor: posts.length === limit ? posts[posts.length - 1]._id : null,
    };
  },
});

export const remove = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post not found");

    // Delete associated likes and comments
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.id))
      .collect();

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.id))
      .collect();

    await Promise.all([
      ...likes.map((like) => ctx.db.delete(like._id)),
      ...comments.map((comment) => ctx.db.delete(comment._id)),
    ]);

    await ctx.db.delete(args.id);
  },
});
