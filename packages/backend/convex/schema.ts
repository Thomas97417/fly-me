import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  flights: defineTable({
    userId: v.string(),
    date: v.string(),
    locationName: v.string(),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    description: v.optional(v.string()),
    droneModel: v.optional(v.string()),
    durationMinutes: v.optional(v.float64()),
    maxAltitudeMeters: v.optional(v.float64()),
    isPublic: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_isPublic", ["isPublic"]),

  flightMedia: defineTable({
    flightId: v.id("flights"),
    userId: v.string(),
    r2Key: v.string(),
    mediaType: v.string(),
    mimeType: v.string(),
    caption: v.optional(v.string()),
  })
    .index("by_flightId", ["flightId"])
    .index("by_userId", ["userId"]),

  subscriptions: defineTable({
    subscriberId: v.string(),
    subscribedToId: v.string(),
  })
    .index("by_subscriber", ["subscriberId"])
    .index("by_subscribed", ["subscribedToId"])
    .index("by_pair", ["subscriberId", "subscribedToId"]),

  likes: defineTable({
    userId: v.string(),
    flightId: v.id("flights"),
  })
    .index("by_user", ["userId"])
    .index("by_flight", ["flightId"])
    .index("by_pair", ["userId", "flightId"]),
});
