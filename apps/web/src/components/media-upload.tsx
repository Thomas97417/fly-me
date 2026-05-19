import { useRef, useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
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
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  function getMaxSize(type: string) {
    return VIDEO_TYPES.includes(type) ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  }

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name} : format non supporté.`;
    }
    if (file.size > getMaxSize(file.type)) {
      const maxMB = getMaxSize(file.type) / (1024 * 1024);
      return `${file.name} : trop volumineux (max ${maxMB} MB).`;
    }
    return null;
  }

  const uploadOne = useCallback(
    async (file: File) => {
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
    },
    [addFlightMedia, flightId, generateUploadUrl, syncMetadata],
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;

      const valid: File[] = [];
      for (const file of list) {
        const err = validateFile(file);
        if (err) {
          toast.error(err);
        } else {
          valid.push(file);
        }
      }

      if (valid.length === 0) return;

      setIsUploading(true);
      const results = await Promise.allSettled(valid.map(uploadOne));
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
      if (fileInput.current) fileInput.current.value = "";
      onUploaded?.();
    },
    [onUploaded, uploadOne],
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) uploadFiles(e.target.files);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  }

  return (
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
      onDrop={handleDrop}
    >
      {isUploading ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <Plus className="size-4 text-muted-foreground" />
      )}
      <span className="text-sm text-muted-foreground">
        {isUploading ? "Upload en cours..." : "Ajouter un ou plusieurs médias"}
      </span>
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
        ref={fileInput}
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
    </label>
  );
}
