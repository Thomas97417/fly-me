import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Dialog } from "@base-ui/react/dialog";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Drone,
  Loader2,
  Maximize2,
  Play,
  Plus,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";

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
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
export const ACCEPT_ATTR =
  "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm";

export interface MediaItem {
  file: File;
  url: string;
  isImage: boolean;
}

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name} : format non supporté.`;
  }
  const maxSize = VIDEO_TYPES.includes(file.type)
    ? MAX_VIDEO_SIZE
    : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    const maxMB = maxSize / (1024 * 1024);
    return `${file.name} : trop volumineux (max ${maxMB} MB).`;
  }
  return null;
}

type DeferredProps = {
  mode: "deferred";
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
};

type ImmediateProps = {
  mode: "immediate";
  flightId: Id<"flights">;
  isOwner: boolean;
};

type Props = DeferredProps | ImmediateProps;

interface DisplayItem {
  key: string;
  url: string;
  isImage: boolean;
}

export function MediaPicker(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Backend access — only relevant in immediate mode
  const remoteMedia = useQuery(
    api.flightMedia.listFlightMedia,
    props.mode === "immediate" ? { flightId: props.flightId } : "skip",
  );
  const generateUploadUrl = useMutation(api.r2.generateFlightMediaUploadUrl);
  const syncMetadata = useMutation(api.r2.syncMetadata);
  const addFlightMedia = useMutation(api.flightMedia.addFlightMedia);
  const deleteFlightMedia = useMutation(api.flightMedia.deleteFlightMedia);

  // Revoke object URLs on unmount in deferred mode (tracked via ref so we
  // capture the latest value, not the initial empty array)
  const deferredValueRef = useRef<MediaItem[]>(
    props.mode === "deferred" ? props.value : [],
  );
  useEffect(() => {
    if (props.mode === "deferred") deferredValueRef.current = props.value;
  });
  useEffect(() => {
    return () => {
      deferredValueRef.current.forEach((item) =>
        URL.revokeObjectURL(item.url),
      );
    };
  }, []);

  // Loading skeleton for immediate mode (initial query)
  if (props.mode === "immediate" && remoteMedia === undefined) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  // Normalize the displayed items
  const items: DisplayItem[] =
    props.mode === "deferred"
      ? props.value.map((item) => ({
          key: item.url,
          url: item.url,
          isImage: item.isImage,
        }))
      : (remoteMedia ?? [])
          .filter((m) => m.url)
          .map((m) => ({
            key: m._id,
            url: m.url!,
            isImage: m.mediaType === "image",
          }));

  const expandedIndex = expandedKey
    ? items.findIndex((i) => i.key === expandedKey)
    : -1;
  const expanded = expandedIndex >= 0 ? items[expandedIndex] : null;

  const canAdd =
    props.mode === "deferred" ||
    (props.mode === "immediate" && props.isOwner);
  const canDeleteRemote = props.mode === "immediate" && props.isOwner;

  // Empty banner: only shown for immediate mode when there are no items
  // AND the user can't add (non-owner)
  if (props.mode === "immediate" && items.length === 0 && !props.isOwner) {
    return (
      <div className="relative flex aspect-[16/9] flex-col items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-br from-muted via-muted/70 to-muted/40">
        <Drone className="size-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Aucun média pour ce vol.
        </p>
      </div>
    );
  }

  async function uploadOne(file: File, flightId: Id<"flights">) {
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
      if (err) {
        toast.error(err);
      } else {
        valid.push(file);
      }
    }
    if (valid.length === 0) return;

    if (props.mode === "deferred") {
      const newItems: MediaItem[] = valid.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        isImage: IMAGE_TYPES.includes(file.type),
      }));
      props.onChange([...props.value, ...newItems]);
    } else {
      setIsUploading(true);
      const results = await Promise.allSettled(
        valid.map((file) => uploadOne(file, props.flightId)),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      const ok = results.length - failed;
      if (ok > 0) {
        toast.success(
          ok === 1 ? "Média uploadé." : `${ok} médias uploadés.`,
        );
      }
      if (failed > 0) {
        toast.error(
          failed === 1
            ? "1 fichier n'a pas pu être uploadé."
            : `${failed} fichiers n'ont pas pu être uploadés.`,
        );
      }
      setIsUploading(false);
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  function removeLocalByKey(key: string) {
    if (props.mode !== "deferred") return;
    const idx = props.value.findIndex((v) => v.url === key);
    if (idx === -1) return;
    URL.revokeObjectURL(props.value[idx].url);
    props.onChange(props.value.filter((_, i) => i !== idx));
  }

  async function deleteRemoteByKey(key: string) {
    try {
      await deleteFlightMedia({ mediaId: key as Id<"flightMedia"> });
      toast.success("Média supprimé.");
    } catch {
      toast.error("Échec de la suppression.");
    }
  }

  function handlePopupKeyDown(e: React.KeyboardEvent) {
    if (!expanded || items.length === 0) return;
    if (e.key === "ArrowLeft" && expandedIndex > 0) {
      e.preventDefault();
      setExpandedKey(items[expandedIndex - 1].key);
    }
    if (e.key === "ArrowRight" && expandedIndex < items.length - 1) {
      e.preventDefault();
      setExpandedKey(items[expandedIndex + 1].key);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.key}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border/40 bg-muted/40"
              >
                <button
                  type="button"
                  className="size-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => setExpandedKey(item.key)}
                >
                  {item.isImage ? (
                    <img
                      src={item.url}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <>
                      <video
                        src={item.url}
                        muted
                        playsInline
                        preload="metadata"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="flex size-11 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                          <Play className="size-5 translate-x-px fill-current" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Gradient overlay at hover */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                  {/* Zoom hint (images only) */}
                  {item.isImage && (
                    <div className="pointer-events-none absolute bottom-1.5 left-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <div className="flex size-6 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur-sm">
                        <Maximize2 className="size-3" />
                      </div>
                    </div>
                  )}

                  {/* Video badge */}
                  {!item.isImage && (
                    <div className="pointer-events-none absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                      <Play className="size-2.5 fill-current" />
                      Vidéo
                    </div>
                  )}
                </button>

                {/* Remove (deferred: instant; immediate+owner: confirm) */}
                {props.mode === "deferred" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLocalByKey(item.key);
                    }}
                    className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-background/85 text-foreground opacity-0 backdrop-blur-sm transition-all hover:bg-destructive hover:text-white group-hover:opacity-100"
                    aria-label="Retirer"
                  >
                    <X className="size-3" />
                  </button>
                )}
                {canDeleteRemote && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="absolute top-1.5 right-1.5 bg-background/85 text-foreground opacity-0 backdrop-blur-sm transition-all hover:bg-destructive hover:text-white group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Supprimer"
                        />
                      }
                    >
                      <Trash2 className="size-3" />
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
                          onClick={() => deleteRemoteByKey(item.key)}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        )}

        {canAdd && (
          <label
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 transition-colors ${
              isUploading
                ? "pointer-events-none opacity-70"
                : isDragging
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50 hover:border-muted-foreground/30"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isUploading) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
            }}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <Plus className="size-4 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {isUploading
                ? "Upload en cours..."
                : items.length === 0
                  ? "Ajouter un ou plusieurs médias"
                  : "Ajouter d'autres médias"}
            </span>
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
          </label>
        )}
      </div>

      {/* Lightbox */}
      <Dialog.Root
        open={!!expanded}
        onOpenChange={(open) => !open && setExpandedKey(null)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 duration-150" />
          <Dialog.Popup
            tabIndex={-1}
            onKeyDown={handlePopupKeyDown}
            onClick={(e) => {
              if (e.target === e.currentTarget) setExpandedKey(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 duration-200"
          >
            {expanded && (
              <>
                <Dialog.Close
                  render={
                    <Button
                      variant="ghost"
                      size="icon-md"
                      className="absolute top-4 right-4 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
                      aria-label="Fermer"
                    />
                  }
                >
                  <X className="size-4" />
                </Dialog.Close>

                {items.length > 1 && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                    {expandedIndex + 1} / {items.length}
                  </div>
                )}

                {items.length > 1 && expandedIndex > 0 && (
                  <Button
                    variant="ghost"
                    size="icon-md"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
                    onClick={() =>
                      setExpandedKey(items[expandedIndex - 1].key)
                    }
                    aria-label="Précédent"
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                )}

                {items.length > 1 && expandedIndex < items.length - 1 && (
                  <Button
                    variant="ghost"
                    size="icon-md"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
                    onClick={() =>
                      setExpandedKey(items[expandedIndex + 1].key)
                    }
                    aria-label="Suivant"
                  >
                    <ChevronRight className="size-5" />
                  </Button>
                )}

                <div className="flex max-h-[85vh] max-w-[90vw] flex-col gap-3">
                  {expanded.isImage ? (
                    <img
                      src={expanded.url}
                      alt=""
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
                </div>

                {/* Delete in lightbox */}
                {props.mode === "deferred" && (
                  <Button
                    size="sm"
                    className="absolute bottom-4 right-4 gap-1.5 border border-white/15 bg-destructive/90 text-white shadow-lg backdrop-blur-md hover:bg-destructive"
                    onClick={() => {
                      removeLocalByKey(expanded.key);
                      setExpandedKey(null);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    Retirer
                  </Button>
                )}
                {canDeleteRemote && (
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
                          onClick={() => {
                            deleteRemoteByKey(expanded.key);
                            setExpandedKey(null);
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
