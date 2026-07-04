import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import {
  Loader2,
  Maximize2,
  Play,
  Plus,
  Trash2,
  TriangleAlert,
  Youtube,
} from "lucide-react";

import { api } from "@my-better-t-app/backend/convex/_generated/api";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { MediaLightbox } from "@/components/media-lightbox";
import {
  ACCEPT_ATTR,
  IMAGE_TYPES,
  validateFile,
} from "@/components/media-picker";
import { cn } from "@/lib/utils";

interface FlightBentoProps {
  flightId: Id<"flights">;
  isOwner: boolean;
  youtubeVideoId: string | null;
  overlay?: React.ReactNode;
}

type Tile =
  | { kind: "youtube"; key: string; videoId: string }
  | { kind: "image"; key: string; url: string }
  | { kind: "video"; key: string; url: string }
  | { kind: "add"; key: "add" };

function bentoSpan(index: number, kind: Tile["kind"]): string {
  if (index === 0) return "col-span-2 row-span-2";
  if (kind === "add") return "col-span-1 row-span-1";
  const slot = (index - 1) % 7;
  if (slot === 0 || slot === 3) return "col-span-2 row-span-1";
  if (slot === 6) return "col-span-1 row-span-2";
  return "col-span-1 row-span-1";
}

export default function FlightBento({
  flightId,
  isOwner,
  youtubeVideoId,
  overlay,
}: FlightBentoProps) {
  const media = useQuery(api.flightMedia.listFlightMedia, { flightId });

  const generateUploadUrl = useMutation(api.r2.generateFlightMediaUploadUrl);
  const syncMetadata = useMutation(api.r2.syncMetadata);
  const addFlightMedia = useMutation(api.flightMedia.addFlightMedia);
  const deleteFlightMedia = useMutation(api.flightMedia.deleteFlightMedia);

  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [youTubePlaying, setYouTubePlaying] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  if (media === undefined) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[clamp(120px,18vw,180px)] grid-flow-dense">
        <Skeleton className="col-span-2 row-span-2 rounded-2xl" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="rounded-2xl" />
        ))}
      </div>
    );
  }

  const mediaTiles: Tile[] = media
    .filter((m) => m.url)
    .map((m) => ({
      kind: m.mediaType === "image" ? "image" : "video",
      key: m._id,
      url: m.url!,
    }));

  const tiles: Tile[] = [];
  if (youtubeVideoId) {
    tiles.push({
      kind: "youtube",
      key: `yt-${youtubeVideoId}`,
      videoId: youtubeVideoId,
    });
  }
  tiles.push(...mediaTiles);
  if (isOwner) tiles.push({ kind: "add", key: "add" });

  // Nothing to render at all (no media, no YouTube, viewer is not owner).
  if (tiles.length === 0) return null;

  // Owner with no actual media or YouTube — promote the add tile to hero.
  const isAddHero =
    isOwner && mediaTiles.length === 0 && !youtubeVideoId;

  // Single media item (image, video, or YouTube) — let it span the full
  // bento width so it can really breathe.
  const mediaTileCount = mediaTiles.length + (youtubeVideoId ? 1 : 0);
  const isSoloMedia = mediaTileCount === 1;

  const lightboxItems = mediaTiles.map((t) => ({
    key: t.key,
    url: (t as { url: string }).url,
    isImage: t.kind === "image",
  }));

  async function uploadOne(file: File) {
    const { key, url } = await generateUploadUrl({ flightId });
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    await syncMetadata({ key });
    await addFlightMedia({
      flightId,
      r2Key: key,
      mediaType: IMAGE_TYPES.includes(file.type) ? "image" : "video",
      mimeType: file.type,
    });
  }

  async function handleFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const valid: File[] = [];
    for (const file of incoming) {
      const err = validateFile(file);
      if (err) toast.error(err);
      else valid.push(file);
    }
    if (valid.length === 0) return;
    setIsUploading(true);
    const results = await Promise.allSettled(valid.map(uploadOne));
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok > 0)
      toast.success(ok === 1 ? "Média uploadé." : `${ok} médias uploadés.`);
    if (failed > 0)
      toast.error(
        failed === 1
          ? "1 fichier n'a pas pu être uploadé."
          : `${failed} fichiers n'ont pas pu être uploadés.`,
      );
    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function deleteMedia(key: string) {
    try {
      await deleteFlightMedia({ mediaId: key as Id<"flightMedia"> });
      toast.success("Média supprimé.");
    } catch {
      toast.error("Échec de la suppression.");
    }
  }

  return (
    <>
      <div
        className={cn(
          "relative grid grid-cols-2 sm:grid-cols-4 gap-3 grid-flow-dense rounded-2xl transition-colors auto-rows-[clamp(140px,20vw,200px)]",
          isDragging && "ring-2 ring-primary/60 ring-offset-2 ring-offset-background",
        )}
        onDragOver={(e) => {
          if (!isOwner) return;
          e.preventDefault();
          if (!isUploading) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setIsDragging(false);
        }}
        onDrop={(e) => {
          if (!isOwner) return;
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
      >
        {tiles.map((tile, index) => {
          const span =
            isAddHero && tile.kind === "add"
              ? "col-span-2 row-span-2"
              : isSoloMedia && tile.kind !== "add"
                ? "col-span-full row-span-2"
                : bentoSpan(index, tile.kind);

          if (tile.kind === "youtube") {
            return (
              <YouTubeTile
                key={tile.key}
                videoId={tile.videoId}
                playing={youTubePlaying}
                onPlay={() => setYouTubePlaying(true)}
                className={span}
              />
            );
          }
          if (tile.kind === "image") {
            return (
              <MediaTile
                key={tile.key}
                url={tile.url}
                kind="image"
                onClick={() => setExpandedKey(tile.key)}
                className={span}
              />
            );
          }
          if (tile.kind === "video") {
            return (
              <MediaTile
                key={tile.key}
                url={tile.url}
                kind="video"
                onClick={() => setExpandedKey(tile.key)}
                className={span}
              />
            );
          }
          // add tile
          return (
            <AddTile
              key={tile.key}
              hero={isAddHero}
              uploading={isUploading}
              onClick={() => inputRef.current?.click()}
              className={span}
            />
          );
        })}

        {isOwner && (
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT_ATTR}
            className="hidden"
            disabled={isUploading}
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
            }}
          />
        )}

        {overlay && !isAddHero && (
          <div className="pointer-events-none absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
            {overlay}
          </div>
        )}
      </div>

      <MediaLightbox
        items={lightboxItems}
        activeKey={expandedKey}
        onClose={() => setExpandedKey(null)}
        onNavigate={setExpandedKey}
        renderAction={(item) =>
          isOwner ? (
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
                  <AlertDialogTitle>Supprimer ce média ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est définitive. Le média sera supprimé
                    immédiatement.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => {
                      deleteMedia(item.key);
                      setExpandedKey(null);
                    }}
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null
        }
      />
    </>
  );
}

function tileBase(className?: string) {
  return cn(
    "group relative overflow-hidden rounded-2xl border border-border/40 bg-muted/40 shadow-sm",
    className,
  );
}

function MediaTile({
  url,
  kind,
  onClick,
  className,
}: {
  url: string;
  kind: "image" | "video";
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        tileBase(className),
        "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      {kind === "image" ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
      ) : (
        <>
          <video
            src={url}
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <Play className="size-5 translate-x-px fill-current" />
            </div>
          </div>
        </>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {kind === "image" && (
        <div className="pointer-events-none absolute bottom-2 left-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex size-7 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur-sm">
            <Maximize2 className="size-3.5" />
          </div>
        </div>
      )}

      {kind === "video" && (
        <div className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
          <Play className="size-2.5 fill-current" />
          Vidéo
        </div>
      )}
    </button>
  );
}

function YouTubeTile({
  videoId,
  playing,
  onPlay,
  className,
}: {
  videoId: string;
  playing: boolean;
  onPlay: () => void;
  className?: string;
}) {
  if (playing) {
    return (
      <div className={tileBase(className)}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title="Vidéo YouTube du vol"
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onPlay}
      className={cn(
        tileBase(className),
        "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <img
        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
      />
      <div className="pointer-events-none absolute inset-0 bg-black/20 transition-colors duration-200 group-hover:bg-black/30" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-16 items-center justify-center rounded-xl bg-[#ff0033] text-white shadow-xl transition-transform duration-300 group-hover:scale-110">
          <Play className="size-6 translate-x-px fill-current" />
        </div>
      </div>
      <div className="pointer-events-none absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
        <Youtube className="size-3" />
        YouTube
      </div>
    </button>
  );
}

function AddTile({
  hero,
  uploading,
  onClick,
  className,
}: {
  hero: boolean;
  uploading: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={uploading}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 px-4 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70",
        className,
      )}
    >
      {uploading ? (
        <Loader2 className="size-6 animate-spin" />
      ) : (
        <Plus className={cn(hero ? "size-8" : "size-6")} />
      )}
      <span
        className={cn(
          "text-center font-medium",
          hero ? "text-sm max-w-[220px]" : "text-xs",
        )}
      >
        {uploading
          ? "Upload en cours…"
          : hero
            ? "Ajoute des photos ou des vidéos pour donner vie à ce vol."
            : "Ajouter"}
      </span>
    </button>
  );
}
