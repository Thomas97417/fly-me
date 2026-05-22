import { Dialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface MediaLightboxItem {
  key: string;
  url: string;
  isImage: boolean;
}

interface MediaLightboxProps {
  items: MediaLightboxItem[];
  activeKey: string | null;
  onClose: () => void;
  onNavigate: (key: string) => void;
  /**
   * Optional action slot displayed in the bottom-right of the lightbox.
   * Receives the currently expanded item so the caller can decide what to render
   * (e.g. a destructive delete button with its own confirmation flow).
   */
  renderAction?: (item: MediaLightboxItem) => React.ReactNode;
}

export function MediaLightbox({
  items,
  activeKey,
  onClose,
  onNavigate,
  renderAction,
}: MediaLightboxProps) {
  const activeIndex = activeKey
    ? items.findIndex((i) => i.key === activeKey)
    : -1;
  const active = activeIndex >= 0 ? items[activeIndex] : null;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!active || items.length === 0) return;
    if (e.key === "ArrowLeft" && activeIndex > 0) {
      e.preventDefault();
      onNavigate(items[activeIndex - 1].key);
    }
    if (e.key === "ArrowRight" && activeIndex < items.length - 1) {
      e.preventDefault();
      onNavigate(items[activeIndex + 1].key);
    }
  }

  return (
    <Dialog.Root
      open={!!active}
      onOpenChange={(open) => !open && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 duration-150" />
        <Dialog.Popup
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 duration-200"
        >
          {active && (
            <>
              <Dialog.Close
                render={
                  <Button
                    variant="ghost"
                    size="icon-md"
                    className="absolute top-4 right-4 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white focus-visible:ring-0 focus-visible:border-transparent"
                    aria-label="Fermer"
                  />
                }
              >
                <X className="size-4" />
              </Dialog.Close>

              {items.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                  {activeIndex + 1} / {items.length}
                </div>
              )}

              {items.length > 1 && activeIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon-md"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white focus-visible:ring-0 focus-visible:border-transparent"
                  onClick={() => onNavigate(items[activeIndex - 1].key)}
                  aria-label="Précédent"
                >
                  <ChevronLeft className="size-5" />
                </Button>
              )}

              {items.length > 1 && activeIndex < items.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon-md"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white focus-visible:ring-0 focus-visible:border-transparent"
                  onClick={() => onNavigate(items[activeIndex + 1].key)}
                  aria-label="Suivant"
                >
                  <ChevronRight className="size-5" />
                </Button>
              )}

              <div className="flex max-h-[85vh] max-w-[90vw] flex-col gap-3">
                {active.isImage ? (
                  <img
                    src={active.url}
                    alt=""
                    className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
                  />
                ) : (
                  <video
                    src={active.url}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl"
                  />
                )}
              </div>

              {renderAction?.(active)}
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
