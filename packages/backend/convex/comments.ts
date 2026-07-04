import { v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { authComponent } from "./auth";
import { r2 } from "./r2";

const MAX_LENGTH = 2000;

async function resolveAvatar(
  ctx: QueryCtx,
  image: string | null | undefined,
): Promise<string | null> {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  const metadata = await r2.getMetadata(ctx, image);
  return metadata?.url ?? null;
}

export const listFlightComments = query({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    const me = await authComponent.safeGetAuthUser(ctx);

    const rows = await ctx.db
      .query("comments")
      .withIndex("by_flight", (q) => q.eq("flightId", args.flightId))
      .collect();

    type Author = { _id: string; name: string | null; image: string | null };
    const authorCache = new Map<string, Author | null>();

    async function getAuthor(userId: string): Promise<Author | null> {
      const cached = authorCache.get(userId);
      if (cached !== undefined) return cached;
      const u = await authComponent.getAnyUserById(ctx, userId);
      if (!u) {
        authorCache.set(userId, null);
        return null;
      }
      const author: Author = {
        _id: u._id,
        name: u.name ?? null,
        image: await resolveAvatar(ctx, u.image),
      };
      authorCache.set(userId, author);
      return author;
    }

    async function withLikes<T extends { _id: Id<"comments"> }>(c: T) {
      const likes = await ctx.db
        .query("commentLikes")
        .withIndex("by_comment", (q) => q.eq("commentId", c._id))
        .collect();
      return {
        ...c,
        likeCount: likes.length,
        isLikedByMe: me ? likes.some((l) => l.userId === me._id) : false,
      };
    }

    const roots = rows
      .filter((c) => !c.parentCommentId)
      .sort((a, b) => a._creationTime - b._creationTime);

    const repliesByParent = new Map<string, typeof rows>();
    for (const c of rows) {
      if (!c.parentCommentId) continue;
      const list = repliesByParent.get(c.parentCommentId) ?? [];
      list.push(c);
      repliesByParent.set(c.parentCommentId, list);
    }

    return await Promise.all(
      roots.map(async (root) => {
        const replies = (repliesByParent.get(root._id) ?? []).sort(
          (a, b) => a._creationTime - b._creationTime,
        );

        return {
          comment: await withLikes(root),
          author: await getAuthor(root.userId),
          replies: await Promise.all(
            replies.map(async (r) => ({
              comment: await withLikes(r),
              author: await getAuthor(r.userId),
            })),
          ),
        };
      }),
    );
  },
});

export const addComment = mutation({
  args: {
    flightId: v.id("flights"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) throw new Error("Not authenticated");

    const content = args.content.trim();
    if (content.length === 0) throw new Error("Le commentaire est vide.");
    if (content.length > MAX_LENGTH)
      throw new Error("Le commentaire est trop long.");

    const flight = await ctx.db.get(args.flightId);
    if (!flight) throw new Error("Vol introuvable.");
    if (flight.allowComments === false)
      throw new Error("Les commentaires sont désactivés pour ce vol.");

    let parentCommentId = args.parentCommentId;
    if (parentCommentId) {
      const parent = await ctx.db.get(parentCommentId);
      if (!parent || parent.flightId !== args.flightId) {
        throw new Error("Commentaire parent invalide.");
      }
      // Normalize: replies always attach to the root.
      if (parent.parentCommentId) {
        parentCommentId = parent.parentCommentId;
      }
    }

    return await ctx.db.insert("comments", {
      flightId: args.flightId,
      userId: me._id,
      content,
      parentCommentId,
    });
  },
});

async function deleteCommentLikes(
  ctx: MutationCtx,
  commentId: Id<"comments">,
) {
  const likes = await ctx.db
    .query("commentLikes")
    .withIndex("by_comment", (q) => q.eq("commentId", commentId))
    .collect();
  for (const l of likes) {
    await ctx.db.delete(l._id);
  }
}

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) return;

    const flight = await ctx.db.get(comment.flightId);
    const isAuthor = comment.userId === me._id;
    const isFlightOwner = flight?.userId === me._id;
    if (!isAuthor && !isFlightOwner) {
      throw new Error("Action non autorisée.");
    }

    if (!comment.parentCommentId) {
      const replies = await ctx.db
        .query("comments")
        .withIndex("by_parent", (q) => q.eq("parentCommentId", args.commentId))
        .collect();
      for (const r of replies) {
        await deleteCommentLikes(ctx, r._id);
        await ctx.db.delete(r._id);
      }
    }

    await deleteCommentLikes(ctx, args.commentId);
    await ctx.db.delete(args.commentId);
  },
});

export const likeComment = mutation({
  args: {
    commentId: v.id("comments"),
    flightId: v.id("flights"),
  },
  handler: async (ctx, args) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.flightId !== args.flightId) {
      throw new Error("Commentaire introuvable.");
    }

    const existing = await ctx.db
      .query("commentLikes")
      .withIndex("by_pair", (q) =>
        q.eq("userId", me._id).eq("commentId", args.commentId),
      )
      .unique();

    if (existing) return;

    await ctx.db.insert("commentLikes", {
      userId: me._id,
      commentId: args.commentId,
    });
  },
});

export const unlikeComment = mutation({
  args: {
    commentId: v.id("comments"),
    flightId: v.id("flights"),
  },
  handler: async (ctx, args) => {
    const me = await authComponent.safeGetAuthUser(ctx);
    if (!me) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.flightId !== args.flightId) {
      throw new Error("Commentaire introuvable.");
    }

    const existing = await ctx.db
      .query("commentLikes")
      .withIndex("by_pair", (q) =>
        q.eq("userId", me._id).eq("commentId", args.commentId),
      )
      .unique();

    if (existing) await ctx.db.delete(existing._id);
  },
});
