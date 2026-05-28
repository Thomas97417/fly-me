import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  X,
  Calendar,
  Drone,
  Clock,
  Mountain,
  ArrowRight,
  User,
  Maximize2,
  Play,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaLightbox } from "@/components/media-lightbox";
import { cn } from "@/lib/utils";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";

interface FlightPreviewData {
  flight: {
    _id: Id<"flights">;
    date: string;
    locationName: string;
    description?: string;
    droneModel?: string;
    durationMinutes?: number;
    maxAltitudeMeters?: number;
    latitude?: number;
    longitude?: number;
  };
  owner: {
    _id: string;
    name: string | null;
    image: string | null;
  };
  media: Array<{
    _id: string;
    url: string | null;
    mediaType: string;
  }>;
}

interface FlightPreviewCardProps {
  flightId: Id<"flights">;
  data: FlightPreviewData | null | undefined;
  onClose: () => void;
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <CardAction>
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted cursor-pointer"
      >
        <X className="size-4" />
      </button>
    </CardAction>
  );
}

function MetaItem({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-3.5 text-muted-foreground/70" />
      {children}
    </span>
  );
}

type MediaTile = { _id: string; url: string; mediaType: "image" | "video" };

function MediaGrid({
  tiles,
  onTileClick,
}: {
  tiles: Array<MediaTile>;
  onTileClick: (key: string) => void;
}) {
  const count = tiles.length;
  if (count === 0) return null;

  const visible = tiles.slice(0, 4);
  const extra = count - visible.length;

  return (
    <div
      className={cn(
        "grid gap-1.5 overflow-hidden rounded-xl",
        count === 1 && "grid-cols-1 aspect-[16/10]",
        count === 2 && "grid-cols-2 aspect-[16/10]",
        count === 3 && "grid-cols-3 grid-rows-2 aspect-[3/2]",
        count >= 4 && "grid-cols-2 grid-rows-2 aspect-square",
      )}
    >
      {visible.map((tile, i) => {
        const isHero = count === 3 && i === 0;
        const isLastWithExtra = extra > 0 && i === visible.length - 1;
        const isVideo = tile.mediaType === "video";

        return (
          <button
            key={tile._id}
            type="button"
            onClick={() => onTileClick(tile._id)}
            className={cn(
              "group relative overflow-hidden bg-muted outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring",
              isHero && "col-span-2 row-span-2",
            )}
          >
            {isVideo ? (
              <video
                src={tile.url}
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
            ) : (
              <img
                src={tile.url}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
            {isLastWithExtra ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 text-base font-semibold text-white backdrop-blur-[2px]">
                +{extra}
              </div>
            ) : isVideo ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                  <Play className="size-4 translate-x-px fill-current" />
                </div>
              </div>
            ) : (
              <div className="pointer-events-none absolute bottom-1.5 left-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="flex size-7 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur-sm">
                  <Maximize2 className="size-3.5" />
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

const cardStyles =
  "w-[24rem] max-w-md rounded-2xl border border-border/50 bg-background/70 backdrop-blur-md shadow-lg ring-0 transition-all duration-200";

export default function FlightPreviewCard({
  flightId,
  data,
  onClose,
}: FlightPreviewCardProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  if (data === undefined) {
    return (
      <Card className={cardStyles}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <CloseButton onClose={onClose} />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="aspect-[16/10] w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (data === null) {
    return (
      <Card className={cardStyles}>
        <CardHeader>
          <CardTitle>Vol introuvable</CardTitle>
          <CloseButton onClose={onClose} />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ce vol n'existe plus ou n'est pas public.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { flight, owner, media } = data;
  const imageMedia = media.filter(
    (m): m is { _id: string; url: string; mediaType: string } =>
      Boolean(m.mediaType === "image" && m.url),
  );
  const videoMedia = media.filter(
    (m): m is { _id: string; url: string; mediaType: string } =>
      Boolean(m.mediaType === "video" && m.url),
  );
  // Image-priority: only fall back to videos when the flight has no images,
  // so existing photo-led popups stay visually identical.
  const tiles: MediaTile[] =
    imageMedia.length > 0
      ? imageMedia.map((m) => ({
          _id: m._id,
          url: m.url,
          mediaType: "image" as const,
        }))
      : videoMedia.map((m) => ({
          _id: m._id,
          url: m.url,
          mediaType: "video" as const,
        }));
  const lightboxItems = tiles.map((t) => ({
    key: t._id,
    url: t.url,
    isImage: t.mediaType === "image",
  }));

  return (
    <>
      <Card className={cardStyles}>
        <CardHeader>
          <Link
            to="/users/$userId"
            params={{ userId: owner._id }}
            className="flex items-center gap-3 group min-w-0"
          >
            <div className="size-12 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
              {owner.image ? (
                <img
                  src={owner.image}
                  alt={owner.name ?? ""}
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {owner.name ?? "Utilisateur"}
              </span>
              <span className="text-[11px] text-muted-foreground/80">
                Voir le profil
              </span>
            </div>
          </Link>
          <CloseButton onClose={onClose} />
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <CardTitle className="text-lg font-semibold tracking-tight leading-tight">
            {flight.locationName}
          </CardTitle>

          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <MetaItem icon={Calendar}>
              {new Date(flight.date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </MetaItem>
            {flight.droneModel && (
              <MetaItem icon={Drone}>{flight.droneModel}</MetaItem>
            )}
            {flight.durationMinutes != null && (
              <MetaItem icon={Clock}>{flight.durationMinutes} min</MetaItem>
            )}
            {flight.maxAltitudeMeters != null && (
              <MetaItem icon={Mountain}>{flight.maxAltitudeMeters} m</MetaItem>
            )}
          </div>

          {flight.description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {flight.description}
            </p>
          )}

          <MediaGrid tiles={tiles} onTileClick={setActiveKey} />
        </CardContent>

        <CardFooter className="justify-center border-none pt-0">
          <Link
            to="/flights/$flightId"
            params={{ flightId }}
            className="w-full"
          >
            <Button size="default" className="gap-2 w-full cursor-pointer">
              Voir le vol
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>

      <MediaLightbox
        items={lightboxItems}
        activeKey={activeKey}
        onClose={() => setActiveKey(null)}
        onNavigate={setActiveKey}
      />
    </>
  );
}
