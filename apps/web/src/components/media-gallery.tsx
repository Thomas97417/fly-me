import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trash2, X, ImageOff } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";

interface MediaGalleryProps {
  flightId: Id<"flights">;
  isOwner: boolean;
}

export default function MediaGallery({ flightId, isOwner }: MediaGalleryProps) {
  const media = useQuery(api.flightMedia.listFlightMedia, { flightId });
  const deleteMedia = useMutation(api.flightMedia.deleteFlightMedia);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (media === undefined) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <ImageOff className="size-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Aucun média pour ce vol.
        </p>
      </div>
    );
  }

  async function handleDelete(
    e: React.MouseEvent,
    mediaId: Id<"flightMedia">,
  ) {
    e.stopPropagation();
    try {
      await deleteMedia({ mediaId });
      toast.success("Média supprimé.");
    } catch {
      toast.error("Échec de la suppression.");
    }
  }

  const expanded = media.find((m) => m._id === expandedId);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {media.map((m) => (
          <div
            key={m._id}
            className="relative group overflow-hidden rounded-lg bg-muted/30 cursor-pointer"
            onClick={() => {
              if (m.url) setExpandedId(m._id);
            }}
          >
            {m.mediaType === "image" && m.url ? (
              <img
                src={m.url}
                alt={m.caption ?? ""}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : m.mediaType === "video" && m.url ? (
              <video
                src={m.url}
                className="aspect-square w-full object-cover"
                muted
              />
            ) : (
              <div className="aspect-square w-full flex items-center justify-center text-muted-foreground text-xs">
                Indisponible
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

            {isOwner && (
              <Button
                variant="ghost"
                size="icon-xs"
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-white"
                onClick={(e) => handleDelete(e, m._id)}
              >
                <Trash2 className="size-3" />
              </Button>
            )}

            {m.mediaType === "video" && m.url && (
              <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                Vidéo
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {expanded && expanded.url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setExpandedId(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            onClick={() => setExpandedId(null)}
          >
            <X className="size-6" />
          </button>

          <div
            className="max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {expanded.mediaType === "image" ? (
              <img
                src={expanded.url}
                alt={expanded.caption ?? ""}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            ) : (
              <video
                src={expanded.url}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] rounded-lg"
              />
            )}
          </div>

          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute bottom-4 right-4 gap-1.5 text-white/70 hover:text-white hover:bg-white/10"
              onClick={(e) => {
                handleDelete(e, expanded._id);
                setExpandedId(null);
              }}
            >
              <Trash2 className="size-3.5" />
              Supprimer
            </Button>
          )}
        </div>
      )}
    </>
  );
}
