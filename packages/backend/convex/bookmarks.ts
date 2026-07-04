import { v } from "convex/values";
import {
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import { authComponent } from "./auth";
import { r2 } from "./r2";
import { resolveFlightPreviews } from "./flightPreviews";

async function resolveUserAvatar(
  ctx: QueryCtx,
  image: string | null | undefined,
): Promise<string | null> {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  const metadata = await r2.getMetadata(ctx, image);
  return metadata?.url ?? null;
}

async function resolveUserCard(ctx: QueryCtx, userId: string) {
  const user = await authComponent.getAnyUserById(ctx, userId);
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name ?? null,
    image: await resolveUserAvatar(ctx, user.image),
  };
}

export const addBookmark = mutation({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_pair", (q) =>
        q.eq("userId", me._id).eq("flightId", args.flightId),
      )
      .unique();

    if (existing) return;

    await ctx.db.insert("bookmarks", {
      userId: me._id,
      flightId: args.flightId,
    });
  },
});

export const removeBookmark = mutation({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_pair", (q) =>
        q.eq("userId", me._id).eq("flightId", args.flightId),
      )
      .unique();

    if (existing) await ctx.db.delete(existing._id);
  },
});

export const getBookmarkState = query({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("bookmarks")
      .withIndex("by_flight", (q) => q.eq("flightId", args.flightId))
      .collect();

    const me = await authComponent.safeGetAuthUser(ctx);
    const isBookmarked = me ? rows.some((r) => r.userId === me._id) : false;

    return { count: rows.length, isBookmarked };
  },
});

export const listMyBookmarks = query({
  args: {},
  handler: async (ctx) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) return [];

    const rows = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .collect();

    const sorted = rows.sort((a, b) => b._creationTime - a._creationTime);

    type Owner = Awaited<ReturnType<typeof resolveUserCard>>;
    const ownerCache = new Map<string, Owner>();

    const flights = await Promise.all(
      sorted.map(async (row) => {
        const flight = await ctx.db.get(row.flightId);
        if (!flight) return null;
        if (!flight.isPublic && flight.userId !== me._id) return null;

        let owner = ownerCache.get(flight.userId);
        if (owner === undefined) {
          owner = await resolveUserCard(ctx, flight.userId);
          ownerCache.set(flight.userId, owner);
        }

        const previews = await resolveFlightPreviews(ctx, flight._id);
        return { ...flight, owner, previews };
      }),
    );

    return flights.filter((f): f is NonNullable<typeof f> => f !== null);
  },
});
