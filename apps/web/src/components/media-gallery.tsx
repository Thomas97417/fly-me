import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Dialog } from "@base-ui/react/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  X,
  Drone,
  Play,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ImageOff,
  TriangleAlert,
} from "lucide-react";
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

  const expanded = media?.find((m) => m._id === expandedId);
  const expandedIndex =
    media && expanded ? media.findIndex((m) => m._id === expanded._id) : -1;

  function handlePopupKeyDown(e: React.KeyboardEvent) {
    if (!media || !expanded) return;
    if (e.key === "ArrowLeft" && expandedIndex > 0) {
      e.preventDefault();
      setExpandedId(media[expandedIndex - 1]._id);
    }
    if (e.key === "ArrowRight" && expandedIndex < media.length - 1) {
      e.preventDefault();
      setExpandedId(media[expandedIndex + 1]._id);
    }
  }

  if (media === undefined) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="relative flex aspect-[16/9] flex-col items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-br from-muted via-muted/70 to-muted/40">
        <Drone className="size-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Aucun média pour ce vol.
        </p>
      </div>
    );
  }

  async function handleDelete(e: React.MouseEvent, mediaId: Id<"flightMedia">) {
    e.stopPropagation();
    try {
      await deleteMedia({ mediaId });
      toast.success("Média supprimé.");
    } catch {
      toast.error("Échec de la suppression.");
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {media.map((m) => (
          <button
            type="button"
            key={m._id}
            className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-muted/40 outline-none transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => {
              if (m.url) setExpandedId(m._id);
            }}
          >
            {m.mediaType === "image" && m.url ? (
              <img
                src={m.url}
                alt={m.caption ?? ""}
                loading="lazy"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
            ) : m.mediaType === "video" && m.url ? (
              <>
                <video
                  src={m.url}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  muted
                  playsInline
                  preload="metadata"
                />
                {/* Play icon overlay for videos */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="flex size-11 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                    <Play className="size-5 translate-x-px fill-current" />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                <ImageOff className="size-5 opacity-50" />
                <span className="text-[10px] uppercase tracking-wider">
                  Indisponible
                </span>
              </div>
            )}

            {/* Gradient overlay (bottom) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

            {/* Zoom hint (image only, on hover) */}
            {m.mediaType === "image" && m.url && (
              <div className="pointer-events-none absolute bottom-1.5 left-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="flex size-6 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur-sm">
                  <Maximize2 className="size-3" />
                </div>
              </div>
            )}

            {/* Video badge */}
            {m.mediaType === "video" && m.url && (
              <div className="pointer-events-none absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                <Play className="size-2.5 fill-current" />
                Vidéo
              </div>
            )}

            {isOwner && (
              <Button
                variant="ghost"
                size="icon-xs"
                className="absolute top-1.5 right-1.5 bg-background/85 text-foreground opacity-0 backdrop-blur-sm transition-all hover:bg-destructive hover:text-white group-hover:opacity-100"
                onClick={(e) => handleDelete(e, m._id)}
              >
                <Trash2 className="size-3" />
              </Button>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog.Root
        open={!!expanded && !!expanded.url}
        onOpenChange={(open) => !open && setExpandedId(null)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 duration-150" />
          <Dialog.Popup
            tabIndex={-1}
            onKeyDown={handlePopupKeyDown}
            onClick={(e) => {
              if (e.target === e.currentTarget) setExpandedId(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 duration-200"
          >
            {expanded && expanded.url && (
              <>
                {/* Close */}
                <Dialog.Close
                  render={
                    <Button
                      variant="ghost"
                      size="icon-md"
                      className="absolute top-4 right-4 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white focus-visible:ring-0"
                      aria-label="Fermer"
                    />
                  }
                >
                  <X className="size-4" />
                </Dialog.Close>

                {/* Counter */}
                {media.length > 1 && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                    {expandedIndex + 1} / {media.length}
                  </div>
                )}

                {/* Prev */}
                {media.length > 1 && expandedIndex > 0 && (
                  <Button
                    variant="ghost"
                    size="icon-md"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
                    onClick={() => setExpandedId(media[expandedIndex - 1]._id)}
                    aria-label="Précédent"
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                )}

                {/* Next */}
                {media.length > 1 && expandedIndex < media.length - 1 && (
                  <Button
                    variant="ghost"
                    size="icon-md"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
                    onClick={() => setExpandedId(media[expandedIndex + 1]._id)}
                    aria-label="Suivant"
                  >
                    <ChevronRight className="size-5" />
                  </Button>
                )}

                {/* Media */}
                <div className="flex max-h-[85vh] max-w-[90vw] flex-col gap-3">
                  {expanded.mediaType === "image" ? (
                    <img
                      src={expanded.url}
                      alt={expanded.caption ?? ""}
                      className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
                    />
                  ) : (
                    <video
                      src={expanded.url}
                      controls
                      autoPlay
                      playsInline
                      className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl"
                    />
                  )}
                  {expanded.caption && (
                    <p className="px-2 text-center text-sm text-white/80">
                      {expanded.caption}
                    </p>
                  )}
                </div>

                {/* Delete (owner) */}
                {isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          size="sm"
                          className="absolute bottom-4 right-4 gap-1.5 border border-white/15 bg-destructive/90 text-white shadow-lg backdrop-blur-md hover:bg-destructive"
                        />
                      }
                    >
                      <Trash2 className="size-3.5" />
                      Supprimer
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogMedia>
                          <TriangleAlert className="size-5" />
                        </AlertDialogMedia>
                        <AlertDialogTitle>
                          Supprimer ce média ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est définitive. Le média sera supprimé
                          immédiatement.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={(e) => {
                            handleDelete(e, expanded._id);
                            setExpandedId(null);
                          }}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
