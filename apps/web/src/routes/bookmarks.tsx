import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import PublicFlightCard from "@/components/public-flight-card";
import { Bookmark } from "lucide-react";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "Mes favoris — FlyMe" },
      {
        name: "description",
        content: "Tous les vols que tu gardes sous le coude.",
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: BookmarksPage,
});

function BookmarksPage() {
  const bookmarks = useQuery(api.bookmarks.listMyBookmarks);

  return (
    <div className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-1.5">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Bookmark className="size-3.5" />
          Collection
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Mes favoris</h1>
        <p className="text-sm text-muted-foreground">
          Tous les vols que tu gardes sous le coude.
        </p>
      </div>

      {bookmarks === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-background/40 py-16 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted/60">
            <Bookmark className="size-4 text-muted-foreground" />
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            Tu n'as encore mis aucun vol en favori — explore le globe pour en
            découvrir.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bookmarks.map((flight) => (
            <PublicFlightCard key={flight._id} flight={flight} />
          ))}
        </div>
      )}
    </div>
  );
}
