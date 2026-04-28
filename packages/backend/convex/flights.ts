import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { r2 } from "./r2";

export const createFlight = mutation({
  args: {
    date: v.string(),
    locationName: v.string(),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    description: v.optional(v.string()),
    droneModel: v.optional(v.string()),
    durationMinutes: v.optional(v.float64()),
    maxAltitudeMeters: v.optional(v.float64()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    return await ctx.db.insert("flights", {
      userId: user._id,
      ...args,
    });
  },
});

export const updateFlight = mutation({
  args: {
    flightId: v.id("flights"),
    date: v.optional(v.string()),
    locationName: v.optional(v.string()),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    description: v.optional(v.string()),
    droneModel: v.optional(v.string()),
    durationMinutes: v.optional(v.float64()),
    maxAltitudeMeters: v.optional(v.float64()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const flight = await ctx.db.get(args.flightId);
    if (!flight || flight.userId !== user._id) {
      throw new Error("Flight not found");
    }

    const { flightId, ...updates } = args;
    await ctx.db.patch(flightId, updates);
  },
});

export const deleteFlight = mutation({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const flight = await ctx.db.get(args.flightId);
    if (!flight || flight.userId !== user._id) {
      throw new Error("Flight not found");
    }

    // Delete associated media and R2 objects
    const media = await ctx.db
      .query("flightMedia")
      .withIndex("by_flightId", (q) => q.eq("flightId", args.flightId))
      .collect();

    for (const m of media) {
      await r2.deleteObject(ctx, m.r2Key);
      await ctx.db.delete(m._id);
    }

    await ctx.db.delete(args.flightId);
  },
});

export const listMyFlights = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];

    const flights = await ctx.db
      .query("flights")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    return flights.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },
});

export const getFlight = query({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    const flight = await ctx.db.get(args.flightId);
    if (!flight) return null;

    if (!flight.isPublic) {
      const user = await authComponent.safeGetAuthUser(ctx);
      if (!user || user._id !== flight.userId) return null;
    }

    return flight;
  },
});

export const getPublicFlightPreview = query({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    const flight = await ctx.db.get(args.flightId);
    if (!flight || !flight.isPublic) return null;

    // Get owner info
    const user = await authComponent.getAnyUserById(ctx, flight.userId);
    let ownerImage: string | null = null;
    if (user?.image) {
      if (user.image.startsWith("http")) {
        ownerImage = user.image;
      } else {
        const metadata = await r2.getMetadata(ctx, user.image);
        ownerImage = metadata?.url ?? null;
      }
    }

    // Get first 4 media items
    const allMedia = await ctx.db
      .query("flightMedia")
      .withIndex("by_flightId", (q) => q.eq("flightId", args.flightId))
      .collect();

    const media = await Promise.all(
      allMedia.slice(0, 4).map(async (m) => {
        const metadata = await r2.getMetadata(ctx, m.r2Key);
        return {
          _id: m._id,
          url: metadata?.url ?? null,
          mediaType: m.mediaType,
        };
      })
    );

    return {
      flight: {
        _id: flight._id,
        date: flight.date,
        locationName: flight.locationName,
        description: flight.description,
        droneModel: flight.droneModel,
        durationMinutes: flight.durationMinutes,
        maxAltitudeMeters: flight.maxAltitudeMeters,
        latitude: flight.latitude,
        longitude: flight.longitude,
      },
      owner: {
        _id: flight.userId,
        name: user?.name ?? null,
        image: ownerImage,
      },
      media,
    };
  },
});

export const getPublicUserProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAnyUserById(ctx, args.userId);
    if (!user) return null;

    // Resolve avatar
    let image: string | null = null;
    if (user.image) {
      if (user.image.startsWith("http")) {
        image = user.image;
      } else {
        const metadata = await r2.getMetadata(ctx, user.image);
        image = metadata?.url ?? null;
      }
    }

    // Get public flights
    const flights = await ctx.db
      .query("flights")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const publicFlights = flights
      .filter((f) => f.isPublic)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      user: {
        _id: user._id,
        name: user.name,
        image,
      },
      flights: publicFlights,
    };
  },
});

export const listPublicFlightLocations = query({
  args: {},
  handler: async (ctx) => {
    const flights = await ctx.db
      .query("flights")
      .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
      .collect();

    return flights
      .filter((f) => f.latitude !== undefined && f.longitude !== undefined)
      .map((f) => ({
        _id: f._id,
        locationName: f.locationName,
        latitude: f.latitude!,
        longitude: f.longitude!,
        date: f.date,
      }));
  },
});
