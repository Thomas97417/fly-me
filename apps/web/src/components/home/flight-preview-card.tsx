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
    <span className="flex items-center gap-1.5">
      <Icon className="size-3.5 text-muted-foreground/70" />
      {children}
    </span>
  );
}

const cardStyles =
  "w-80 max-w-sm rounded-2xl border border-border/50 bg-background/70 backdrop-blur-md shadow-lg ring-0 transition-all duration-200";

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
            <Skeleton className="size-10 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <CloseButton onClose={onClose} />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-28" />
          <div className="grid grid-cols-2 gap-1.5">
            <Skeleton className="aspect-square rounded-md" />
            <Skeleton className="aspect-square rounded-md" />
          </div>
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
  const images = media.filter((m) => m.mediaType === "image" && m.url);
  const lightboxItems = images.map((img) => ({
    key: img._id,
    url: img.url!,
    isImage: true,
  }));

  return (
    <>
      <Card className={cardStyles}>
        <CardHeader>
          <Link
            to="/users/$userId"
            params={{ userId: owner._id }}
            className="flex items-center gap-3 group"
          >
            <div className="size-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
              {owner.image ? (
                <img
                  src={owner.image}
                  alt={owner.name ?? ""}
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {owner.name ?? "Utilisateur"}
              </span>
              <span className="text-xs text-muted-foreground">
                Voir le profil
              </span>
            </div>
          </Link>
          <CloseButton onClose={onClose} />
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <CardTitle className="text-base font-semibold tracking-tight leading-tight">
            {flight.locationName}
          </CardTitle>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
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
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {flight.description}
            </p>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {images.map((img) => (
                <button
                  key={img._id}
                  type="button"
                  onClick={() => setActiveKey(img._id)}
                  className="group relative aspect-square overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <img
                    src={img.url!}
                    alt=""
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
                  <div className="pointer-events-none absolute bottom-1.5 left-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="flex size-6 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur-sm">
                      <Maximize2 className="size-3" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
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
