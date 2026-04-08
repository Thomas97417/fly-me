import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { r2 } from "./r2";

export const addFlightMedia = mutation({
  args: {
    flightId: v.id("flights"),
    r2Key: v.string(),
    mediaType: v.string(),
    mimeType: v.string(),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const flight = await ctx.db.get(args.flightId);
    if (!flight || flight.userId !== user._id) {
      throw new Error("Flight not found");
    }

    return await ctx.db.insert("flightMedia", {
      ...args,
      userId: user._id,
    });
  },
});

export const deleteFlightMedia = mutation({
  args: { mediaId: v.id("flightMedia") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const media = await ctx.db.get(args.mediaId);
    if (!media || media.userId !== user._id) {
      throw new Error("Media not found");
    }

    await r2.deleteObject(ctx, media.r2Key);
    await ctx.db.delete(args.mediaId);
  },
});

export const listFlightMedia = query({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query("flightMedia")
      .withIndex("by_flightId", (q) => q.eq("flightId", args.flightId))
      .collect();

    const results = await Promise.all(
      media.map(async (m) => {
        const metadata = await r2.getMetadata(ctx, m.r2Key);
        return { ...m, url: metadata?.url ?? null };
      })
    );

    return results;
  },
});
