import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { resolveFlightPreviews } from "./flightPreviews";

export const likeFlight = mutation({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_pair", (q) =>
        q.eq("userId", me._id).eq("flightId", args.flightId),
      )
      .unique();

    if (existing) return;

    await ctx.db.insert("likes", {
      userId: me._id,
      flightId: args.flightId,
    });
  },
});

export const unlikeFlight = mutation({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_pair", (q) =>
        q.eq("userId", me._id).eq("flightId", args.flightId),
      )
      .unique();

    if (existing) await ctx.db.delete(existing._id);
  },
});

export const getLikeState = query({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_flight", (q) => q.eq("flightId", args.flightId))
      .collect();

    const me = await authComponent.safeGetAuthUser(ctx);
    const isLiked = me
      ? likes.some((l) => l.userId === me._id)
      : false;

    return { count: likes.length, isLiked };
  },
});

export const listMyLikes = query({
  args: {},
  handler: async (ctx) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) return [];

    const rows = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .collect();

    const sorted = rows.sort((a, b) => b._creationTime - a._creationTime);

    const flights = await Promise.all(
      sorted.map(async (row) => {
        const flight = await ctx.db.get(row.flightId);
        if (!flight) return null;
        if (!flight.isPublic && flight.userId !== me._id) return null;

        const previews = await resolveFlightPreviews(ctx, flight._id);
        return { ...flight, previews };
      }),
    );

    return flights.filter((f): f is NonNullable<typeof f> => f !== null);
  },
});
