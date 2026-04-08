import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { authComponent } from "./auth";

export const r2 = new R2(components.r2);

// Pass DataModel as a generic type parameter to get proper TypeScript typing
// for all callback contexts. Without this, ctx will be typed as GenericDocument
// instead of your specific table types.
export const { generateUploadUrl, syncMetadata, listMetadata, getMetadata } = r2.clientApi<DataModel>({
  checkUpload: async (ctx, bucket) => {
    // const user = await userFromAuth(ctx);
    // ...validate that the user can upload to this bucket
  },
  onUpload: async (ctx, bucket, key) => {
    // ...do something with the key
    // This technically runs in the `syncMetadata` mutation, as the upload
    // is performed from the client side. Will run if using the `useUploadFile`
    // hook, or if `syncMetadata` function is called directly. Runs after the
    // `checkUpload` callback.
  },
});

export const generateUserUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }
    const key = `uploads/${crypto.randomUUID()}`;
    return r2.generateUploadUrl(key);
  },
});

export const generateFlightMediaUploadUrl = mutation({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const flight = await ctx.db.get(args.flightId);
    if (!flight || flight.userId !== user._id) {
      throw new Error("Flight not found");
    }

    const key = `flights/${args.flightId}/${crypto.randomUUID()}`;
    return await r2.generateUploadUrl(key);
  },
});

export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }
    // Delete the old avatar from R2 if it exists
    if (user.image && user.image.startsWith("avatars/")) {
      await r2.deleteObject(ctx, user.image);
    }
    const key = `avatars/${user._id}/${crypto.randomUUID()}`;
    return r2.generateUploadUrl(key);
  },
});
