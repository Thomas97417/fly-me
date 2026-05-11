import { useRef, useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X, VideoIcon } from "lucide-react";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

interface MediaUploadProps {
  flightId: Id<"flights">;
  onUploaded?: () => void;
}

export default function MediaUpload({
  flightId,
  onUploaded,
}: MediaUploadProps) {
  const generateUploadUrl = useMutation(api.r2.generateFlightMediaUploadUrl);
  const syncMetadata = useMutation(api.r2.syncMetadata);
  const addFlightMedia = useMutation(api.flightMedia.addFlightMedia);
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  function getMaxSize(type: string) {
    return VIDEO_TYPES.includes(type) ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  }

  const processFile = useCallback(
    (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(
          "Format non supporté. Utilisez JPG, PNG, WebP, MP4, MOV ou WebM.",
        );
        return;
      }
      if (file.size > getMaxSize(file.type)) {
        const maxMB = getMaxSize(file.type) / (1024 * 1024);
        toast.error(`Fichier trop volumineux. Maximum ${maxMB} MB.`);
        return;
      }
      setSelectedFile(file);
      if (IMAGE_TYPES.includes(file.type)) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview(null);
      }
    },
    [],
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) processFile(file);
  }

  function clearSelection() {
    setSelectedFile(null);
    setPreview(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const { key, url } = await generateUploadUrl({ flightId });
      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });
      await syncMetadata({ key });
      await addFlightMedia({
        flightId,
        r2Key: key,
        mediaType: IMAGE_TYPES.includes(selectedFile.type) ? "image" : "video",
        mimeType: selectedFile.type,
      });
      toast.success("Média uploadé.");
      clearSelection();
      onUploaded?.();
    } catch {
      toast.error("Échec de l'upload.");
    } finally {
      setIsUploading(false);
    }
  }

  if (selectedFile) {
    return (
      <form onSubmit={handleUpload} className="flex flex-col gap-3">
        <div className="relative rounded-lg border overflow-hidden bg-muted/30">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-48 object-contain"
            />
          ) : (
            <div className="flex items-center gap-3 px-4 py-3">
              <VideoIcon className="size-6 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={clearSelection}
            className="absolute top-2 right-2 p-1 rounded-md bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <Button type="submit" size="sm" disabled={isUploading} className="gap-1.5 self-end">
          {isUploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          {isUploading ? "Upload..." : "Ajouter"}
        </Button>
      </form>
    );
  }

  return (
    <label
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "hover:bg-muted/50 hover:border-muted-foreground/30"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <Plus className="size-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        Ajouter un média
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
        ref={fileInput}
        onChange={handleFileChange}
        className="hidden"
      />
    </label>
  );
}
