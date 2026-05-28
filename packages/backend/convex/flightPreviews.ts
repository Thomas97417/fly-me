import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { r2 } from "./r2";

export type FlightPreview = {
  _id: Id<"flightMedia">;
  url: string | null;
  mediaType: "image" | "video";
};

/**
 * Resolve up to 3 preview items for a flight, suitable for the preview strip
 * on `PublicFlightCard` / `FlightCard`.
 *
 * Image-priority: images are preferred. Videos are used as fallback when the
 * flight has no images at all, so a video-only flight still gets a thumbnail
 * (the browser renders the first frame via `<video preload="metadata">`).
 */
export async function resolveFlightPreviews(
  ctx: QueryCtx,
  flightId: Id<"flights">,
): Promise<FlightPreview[]> {
  const allMedia = await ctx.db
    .query("flightMedia")
    .withIndex("by_flightId", (q) => q.eq("flightId", flightId))
    .collect();

  const images = allMedia.filter((m) => m.mediaType === "image");
  const videos = allMedia.filter((m) => m.mediaType === "video");
  const source = images.length > 0 ? images : videos;

  return await Promise.all(
    source.slice(0, 3).map(async (m) => {
      const metadata = await r2.getMetadata(ctx, m.r2Key);
      return {
        _id: m._id,
        url: metadata?.url ?? null,
        mediaType: m.mediaType as "image" | "video",
      };
    }),
  );
}
