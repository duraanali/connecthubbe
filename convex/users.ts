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

    // Get total posts count
    const allPosts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", args.id))
      .collect();

    return {
      ...user,
      name: user.name || "",
      email: user.email || "",
      avatarUrl: user.avatarUrl || "",
      followersCount: followers.length,
      followingCount: following.length,
      postsCount: allPosts.length,
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

export const searchUsers = query({
  args: {
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
    currentUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get all users
    const allUsers = await ctx.db.query("users").collect();

    // Filter by name if query is provided, otherwise return all users
    const filteredUsers = args.query
      ? allUsers
          .filter((user) =>
            user.name.toLowerCase().includes(args.query!.toLowerCase())
          )
          .slice(0, limit)
      : allUsers.slice(0, limit);

    // For each user, check if current user is following them
    const usersWithFollowingStatus = await Promise.all(
      filteredUsers.map(async (user) => {
        let isFollowing = false;

        if (args.currentUserId) {
          const follow = await ctx.db
            .query("follows")
            .withIndex("by_follower_following", (q) =>
              q
                .eq("followerId", args.currentUserId!)
                .eq("followingId", user._id)
            )
            .first();

          isFollowing = !!follow;
        }

        return {
          id: user._id,
          name: user.name || "",
          username: user.email.split("@")[0], // Use email prefix as username
          avatar: user.avatarUrl || null,
          is_following: isFollowing,
        };
      })
    );

    return usersWithFollowingStatus;
  },
});

export const getPublicProfile = query({
  args: {
    userId: v.id("users"),
    currentUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get follower and following counts
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    // Check if current user is following this user
    let isFollowing = false;
    if (args.currentUserId) {
      const follow = await ctx.db
        .query("follows")
        .withIndex("by_follower_following", (q) =>
          q.eq("followerId", args.currentUserId!).eq("followingId", args.userId)
        )
        .first();

      isFollowing = !!follow;
    }

    return {
      id: user._id,
      name: user.name || "",
      username: user.email.split("@")[0], // Use email prefix as username
      avatar: user.avatarUrl || null,
      bio: "", // Not in schema yet, return empty string
      followers_count: followers.length,
      following_count: following.length,
      is_following: isFollowing,
    };
  },
});

export const getFollowers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all follows where this user is being followed
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    // Get user details for each follower
    const followers = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.followerId);
        return {
          id: user?._id || "",
          name: user?.name || "",
          email: user?.email || "",
          avatarUrl: user?.avatarUrl || "",
          username: user?.email ? user.email.split("@")[0] : "",
        };
      })
    );

    return followers;
  },
});
