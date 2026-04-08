import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, ImageIcon, VideoIcon } from "lucide-react";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

interface MediaUploadProps {
  flightId: Id<"flights">;
  onUploaded?: () => void;
}

export default function MediaUpload({ flightId, onUploaded }: MediaUploadProps) {
  const generateUploadUrl = useMutation(api.r2.generateFlightMediaUploadUrl);
  const syncMetadata = useMutation(api.r2.syncMetadata);
  const addFlightMedia = useMutation(api.flightMedia.addFlightMedia);
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  function getMaxSize(type: string) {
    return VIDEO_TYPES.includes(type) ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Format non supporté. Utilisez JPG, PNG, WebP, MP4, MOV ou WebM.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    if (file.size > getMaxSize(file.type)) {
      const maxMB = getMaxSize(file.type) / (1024 * 1024);
      toast.error(`Fichier trop volumineux. Maximum ${maxMB} MB.`);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }

    setSelectedFile(file);
    if (IMAGE_TYPES.includes(file.type)) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  }

  function clearSelection() {
    setSelectedFile(null);
    setPreview(null);
    if (fileInput.current) fileInput.current.value = "";
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
      toast.success("Média uploadé avec succès.");
      clearSelection();
      onUploaded?.();
    } catch {
      toast.error("Échec de l'upload.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="flex flex-col gap-4">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="max-h-48 w-full rounded-lg border object-contain"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
            onClick={clearSelection}
          >
            <X className="size-3" />
          </Button>
        </div>
      ) : selectedFile ? (
        <div className="relative flex items-center gap-3 rounded-lg border p-4">
          <VideoIcon className="size-8 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={clearSelection}
          >
            <X className="size-3" />
          </Button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 transition-colors hover:bg-muted/50">
          <div className="flex gap-2">
            <ImageIcon className="text-muted-foreground size-6" />
            <VideoIcon className="text-muted-foreground size-6" />
          </div>
          <span className="text-muted-foreground text-sm">
            Cliquez pour sélectionner une image ou vidéo
          </span>
          <span className="text-muted-foreground text-xs">
            JPG, PNG, WebP (10MB) — MP4, MOV, WebM (100MB)
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
            ref={fileInput}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      <Button type="submit" disabled={!selectedFile || isUploading}>
        {isUploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <Upload className="size-4" />
            Uploader
          </>
        )}
      </Button>
    </form>
  );
}
