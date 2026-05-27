import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { Bookmark } from "lucide-react";

interface BookmarkButtonProps {
  flightId: string;
  className?: string;
}

export default function BookmarkButton({
  flightId,
  className,
}: BookmarkButtonProps) {
  const id = flightId as Id<"flights">;
  const state = useQuery(api.bookmarks.getBookmarkState, { flightId: id });
  const add = useMutation(api.bookmarks.addBookmark).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.bookmarks.getBookmarkState, {
        flightId: args.flightId,
      });
      if (current && !current.isBookmarked) {
        localStore.setQuery(
          api.bookmarks.getBookmarkState,
          { flightId: args.flightId },
          { count: current.count + 1, isBookmarked: true },
        );
      }
    },
  );
  const remove = useMutation(api.bookmarks.removeBookmark).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.bookmarks.getBookmarkState, {
        flightId: args.flightId,
      });
      if (current && current.isBookmarked) {
        localStore.setQuery(
          api.bookmarks.getBookmarkState,
          { flightId: args.flightId },
          { count: Math.max(0, current.count - 1), isBookmarked: false },
        );
      }

      // Also drop the flight from the personal bookmarks list so the
      // `/bookmarks` page reacts instantly when unbookmarking from there.
      const list = localStore.getQuery(api.bookmarks.listMyBookmarks, {});
      if (list && list.some((f) => f._id === args.flightId)) {
        localStore.setQuery(
          api.bookmarks.listMyBookmarks,
          {},
          list.filter((f) => f._id !== args.flightId),
        );
      }
    },
  );
  const user = useCurrentUser();
  const navigate = useNavigate();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate({ to: "/sign-in" });
      return;
    }

    try {
      if (state?.isBookmarked) {
        await remove({ flightId: id });
      } else {
        await add({ flightId: id });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Une erreur est survenue",
      );
    }
  };

  const isBookmarked = state?.isBookmarked ?? false;
  const count = state?.count ?? 0;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isBookmarked ? "Retirer des favoris" : "Mettre en favoris"}
      className={cn(
        "inline-flex min-w-14 cursor-pointer items-center justify-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
        isBookmarked
          ? "text-blue-500"
          : "text-muted-foreground hover:text-blue-500",
        className,
      )}
    >
      <Bookmark className={cn("size-3.5", isBookmarked && "fill-current")} />
      {count}
    </button>
  );
}
