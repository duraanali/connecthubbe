import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return user;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      password: args.password,
      createdAt: args.createdAt,
    });
    return userId;
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;

    // Get follower and following counts
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.id))
      .collect();

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.id))
      .collect();

    // Get recent posts
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", args.id))
      .order("desc")
      .take(10);

    return {
      ...user,
      followersCount: followers.length,
      followingCount: following.length,
      recentPosts: posts,
    };
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

export const storeToken = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tokens", {
      userId: args.userId,
      token: args.token,
      createdAt: Date.now(),
    });
    return true;
  },
});

export const validateToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenRecord) return null;

    const user = await ctx.db.get(tokenRecord.userId);
    if (!user) return null;

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
    };
  },
});
