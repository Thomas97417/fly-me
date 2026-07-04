import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
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

export const subscribe = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) throw new Error("Not authenticated");
    if (me._id === args.userId) {
      throw new Error("Tu ne peux pas t'abonner à toi-même.");
    }

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_pair", (q) =>
        q.eq("subscriberId", me._id).eq("subscribedToId", args.userId),
      )
      .unique();

    if (existing) return;

    await ctx.db.insert("subscriptions", {
      subscriberId: me._id,
      subscribedToId: args.userId,
    });
  },
});

export const unsubscribe = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_pair", (q) =>
        q.eq("subscriberId", me._id).eq("subscribedToId", args.userId),
      )
      .unique();

    if (existing) await ctx.db.delete(existing._id);
  },
});

export const getSubscriptionState = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) return { isSubscribed: false, isSelf: false };

    if (me._id === args.userId) {
      return { isSubscribed: false, isSelf: true };
    }

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_pair", (q) =>
        q.eq("subscriberId", me._id).eq("subscribedToId", args.userId),
      )
      .unique();

    return { isSubscribed: existing !== null, isSelf: false };
  },
});

export const getSubscriptionStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscribed", (q) => q.eq("subscribedToId", args.userId))
      .collect();

    const following = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscriber", (q) => q.eq("subscriberId", args.userId))
      .collect();

    return {
      followersCount: followers.length,
      followingCount: following.length,
    };
  },
});

export const listMySubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) return [];

    const rows = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscriber", (q) => q.eq("subscriberId", me._id))
      .collect();

    const users = await Promise.all(
      rows.map((r) => resolveUserCard(ctx, r.subscribedToId)),
    );

    return users.filter((u): u is NonNullable<typeof u> => u !== null);
  },
});

export const listMyFollowers = query({
  args: {},
  handler: async (ctx) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) return [];

    const rows = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscribed", (q) => q.eq("subscribedToId", me._id))
      .collect();

    const users = await Promise.all(
      rows.map((r) => resolveUserCard(ctx, r.subscriberId)),
    );

    return users.filter((u): u is NonNullable<typeof u> => u !== null);
  },
});

export const listSubscriptionFeed = query({
  args: {},
  handler: async (ctx) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) return [];

    const rows = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscriber", (q) => q.eq("subscriberId", me._id))
      .collect();

    if (rows.length === 0) return [];

    const flightsPerUser = await Promise.all(
      rows.map((r) =>
        ctx.db
          .query("flights")
          .withIndex("by_userId", (q) => q.eq("userId", r.subscribedToId))
          .collect(),
      ),
    );

    const publicFlights = flightsPerUser
      .flat()
      .filter((f) => f.isPublic)
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      .slice(0, 30);

    type Owner = Awaited<ReturnType<typeof resolveUserCard>>;
    const ownerCache = new Map<string, Owner>();

    return await Promise.all(
      publicFlights.map(async (flight) => {
        let owner = ownerCache.get(flight.userId);
        if (owner === undefined) {
          owner = await resolveUserCard(ctx, flight.userId);
          ownerCache.set(flight.userId, owner);
        }

        const previews = await resolveFlightPreviews(ctx, flight._id);
        return { ...flight, owner, previews };
      }),
    );
  },
});
