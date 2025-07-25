import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate upload URL for profile images
export const generateUploadUrl = mutation({
  args: {
    type: v.union(v.literal("profile"), v.literal("post")),
  },
  handler: async (ctx, args) => {
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return uploadUrl;
  },
});

// Save uploaded file and return the storage ID
export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    type: v.union(v.literal("profile"), v.literal("post")),
  },
  handler: async (ctx, args) => {
    // Get the file URL
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("File not found");
    }

    return {
      storageId: args.storageId,
      url: url,
    };
  },
});

// Get file URL by storage ID
export const getFileUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Delete file
export const deleteFile = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
    return { success: true };
  },
});
