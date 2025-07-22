import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Post functions
export const createPost = mutation({
  args: {
    userId: v.id("users"),
    text: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const postId = await ctx.db.insert("posts", {
      userId: args.userId,
      text: args.text,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });

    return await ctx.db.get(postId);
  },
});

export const getPost = query({
  args: {
    postId: v.id("posts"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    const user = await ctx.db.get(post.userId);

    // Get likes count for this post
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    // Get comments count for this post
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    // Check if current user has liked this post
    let likedByUser = false;
    if (args.userId) {
      const userLike = await ctx.db
        .query("likes")
        .withIndex("by_user_post", (q) =>
          q.eq("userId", args.userId!).eq("postId", args.postId)
        )
        .first();
      likedByUser = !!userLike;
    }

    return {
      id: post._id,
      userId: post.userId,
      text: post.text || "",
      imageUrl: post.imageUrl || "",
      createdAt: post.createdAt,
      likesCount: likes.length,
      commentsCount: comments.length,
      likedByUser,
      user: {
        id: user?._id || "",
        name: user?.name || "",
        email: user?.email || "",
        avatarUrl: user?.avatarUrl || "",
      },
    };
  },
});

export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.userId !== args.userId) {
      throw new Error("Unauthorized to delete this post");
    }

    // Delete all likes for this post
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete all comments for this post
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Finally delete the post
    await ctx.db.delete(args.postId);
  },
});

export const getFeed = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    const followingIds = follows.map((follow) => follow.followingId);
    followingIds.push(args.userId); // Include user's own posts

    const posts = await Promise.all(
      followingIds.map(async (id) => {
        return await ctx.db
          .query("posts")
          .withIndex("by_user", (q) => q.eq("userId", id))
          .collect();
      })
    );

    const allPosts = posts.flat().sort((a, b) => b.createdAt - a.createdAt);

    // Add user info, likes count, comments count, and likedByUser for each post
    const postsWithDetails = await Promise.all(
      allPosts.map(async (post) => {
        const user = await ctx.db.get(post.userId);

        // Get likes count for this post
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        // Get comments count for this post
        const comments = await ctx.db
          .query("comments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        // Check if current user has liked this post
        const userLike = await ctx.db
          .query("likes")
          .withIndex("by_user_post", (q) =>
            q.eq("userId", args.userId).eq("postId", post._id)
          )
          .first();

        return {
          id: post._id,
          userId: post.userId,
          text: post.text || "",
          imageUrl: post.imageUrl || "",
          createdAt: post.createdAt,
          likesCount: likes.length,
          commentsCount: comments.length,
          likedByUser: !!userLike,
          user: {
            id: user?._id || "",
            name: user?.name || "",
            email: user?.email || "",
            avatarUrl: user?.avatarUrl || "",
          },
        };
      })
    );

    return postsWithDetails;
  },
});

// Follow functions
export const follow = mutation({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if already following
    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .first();

    if (existingFollow) {
      throw new Error("Already following this user");
    }

    // Create follow relationship
    await ctx.db.insert("follows", {
      followerId: args.followerId,
      followingId: args.followingId,
      createdAt: Date.now(),
    });
  },
});

export const unfollow = mutation({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .first();

    if (follow) {
      await ctx.db.delete(follow._id);
    }
  },
});

export const getFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    const following = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.followingId);
        return {
          id: user?._id || "",
          name: user?.name || "",
          email: user?.email || "",
          avatarUrl: user?.avatarUrl || "",
          bio: user?.bio || "",
        };
      })
    );

    return following;
  },
});

// Like functions
export const like = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Check if already liked
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", args.userId).eq("postId", args.postId)
      )
      .first();

    if (existingLike) {
      throw new Error("Already liked this post");
    }

    // Create like
    await ctx.db.insert("likes", {
      userId: args.userId,
      postId: args.postId,
      createdAt: Date.now(),
    });
  },
});

export const unlike = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("likes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", args.userId).eq("postId", args.postId)
      )
      .first();

    if (like) {
      await ctx.db.delete(like._id);
    }
  },
});

export const getLikes = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    const users = await Promise.all(
      likes.map(async (like) => {
        const user = await ctx.db.get(like.userId);
        return {
          id: user?._id || "",
          name: user?.name || "",
          email: user?.email || "",
          avatarUrl: user?.avatarUrl || "",
          bio: user?.bio || "",
        };
      })
    );

    return users;
  },
});

// Comment functions
export const createComment = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      userId: args.userId,
      text: args.text,
      createdAt: Date.now(),
    });

    return await ctx.db.get(commentId);
  },
});

export const getComments = query({
  args: {
    postId: v.id("posts"),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("desc")
      .take(args.limit || 10);

    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user: {
            id: user?._id || "",
            name: user?.name || "",
            email: user?.email || "",
            avatarUrl: user?.avatarUrl || "",
            bio: user?.bio || "",
          },
        };
      })
    );

    return commentsWithUsers;
  },
});

export const getAllPosts = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db.query("posts").order("desc").collect();

    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        const user = await ctx.db.get(post.userId);

        // Get likes count for this post
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        // Get comments count for this post
        const comments = await ctx.db
          .query("comments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        // Check if current user has liked this post
        let likedByUser = false;
        if (args.userId) {
          const userLike = await ctx.db
            .query("likes")
            .withIndex("by_user_post", (q) =>
              q.eq("userId", args.userId!).eq("postId", post._id)
            )
            .first();
          likedByUser = !!userLike;
        }

        return {
          id: post._id,
          text: post.text || "",
          imageUrl: post.imageUrl || "",
          createdAt: post.createdAt,
          likesCount: likes.length,
          commentsCount: comments.length,
          likedByUser,
          user: {
            id: user?._id || "",
            name: user?.name || "",
            email: user?.email || "",
            avatarUrl: user?.avatarUrl || "",
            bio: user?.bio || "",
          },
        };
      })
    );

    return postsWithUsers.sort((a, b) => b.createdAt - a.createdAt);
  },
});
