import { useQuery, useMutation } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";

interface MediaGalleryProps {
  flightId: Id<"flights">;
  isOwner: boolean;
}

export default function MediaGallery({ flightId, isOwner }: MediaGalleryProps) {
  const media = useQuery(api.flightMedia.listFlightMedia, { flightId });
  const deleteMedia = useMutation(api.flightMedia.deleteFlightMedia);

  if (media === undefined) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aucun média pour ce vol.
      </p>
    );
  }

  async function handleDelete(mediaId: Id<"flightMedia">) {
    try {
      await deleteMedia({ mediaId });
      toast.success("Média supprimé.");
    } catch {
      toast.error("Échec de la suppression.");
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {media.map((m) => (
        <div
          key={m._id}
          className="relative group overflow-hidden rounded-lg border bg-muted/30"
        >
          {m.mediaType === "image" && m.url ? (
            <img
              src={m.url}
              alt={m.caption ?? "Flight media"}
              className="aspect-square w-full object-cover"
            />
          ) : m.mediaType === "video" && m.url ? (
            <video
              src={m.url}
              controls
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="aspect-square w-full flex items-center justify-center text-muted-foreground text-sm">
              Média indisponible
            </div>
          )}
          {isOwner && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
              onClick={() => handleDelete(m._id)}
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
