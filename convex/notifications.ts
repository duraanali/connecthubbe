import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get all notifications for a user
export const getNotifications = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Get sender information for each notification
    const notificationsWithSenders = await Promise.all(
      notifications.map(async (notification) => {
        const sender = await ctx.db.get(notification.senderId);
        return {
          id: notification._id,
          type: notification.type,
          message: notification.message,
          sender_id: notification.senderId,
          sender_name: sender?.name || "Unknown User",
          sender_avatar: sender?.avatarUrl || "",
          reference_id: notification.referenceId || null,
          is_read: notification.isRead,
          created_at: notification.createdAt,
        };
      })
    );

    return notificationsWithSenders;
  },
});

// Create a new notification
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    senderId: v.id("users"),
    type: v.string(),
    message: v.string(),
    referenceId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    // Don't create notification if user is notifying themselves
    if (args.userId === args.senderId) {
      return null;
    }

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      senderId: args.senderId,
      type: args.type,
      message: args.message,
      referenceId: args.referenceId || undefined,
      isRead: false,
      createdAt: Date.now(),
    });

    return await ctx.db.get(notificationId);
  },
});

// Mark a single notification as read
export const markNotificationAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Ensure user can only mark their own notifications as read
    if (notification.userId !== args.userId) {
      throw new Error("Unauthorized to modify this notification");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });

    return { success: true };
  },
});

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    let updatedCount = 0;
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
      });
      updatedCount++;
    }

    return { success: true, updated_count: updatedCount };
  },
});

// Get unread notification count
export const getUnreadCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});
