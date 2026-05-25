import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaPicker } from "@/components/media-picker";
import LocationViewer from "@/components/location-viewer";
import {
  MapPin,
  Calendar,
  Clock,
  Drone,
  Mountain,
  Globe,
  Lock,
  ArrowLeft,
  FileText,
  Images,
  Youtube,
  MessageCircle,
} from "lucide-react";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";

import OwnerAvatar from "@/components/ui/owner-avatar";
import { DeleteFlightDialog } from "@/components/flight/delete-flight-dialog";
import FlightComments from "@/components/flight/flight-comments";

export const Route = createFileRoute("/flights/$flightId")({
  head: () => ({
    meta: [
      { title: "Détail du Vol — FlyMe" },
      {
        name: "description",
        content: "Détails et médias de la sortie drone.",
      },
    ],
  }),
  component: FlightDetailPage,
});

function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.endsWith("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const match = u.pathname.match(/^\/(?:embed|shorts|v)\/([^/?]+)/);
      if (match) return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-background/70 backdrop-blur-md p-4 shadow-sm">
      <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="text-sm font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  label,
  action,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </div>
        {action}
      </div>
      <div className="rounded-2xl border border-border/50 bg-background/70 backdrop-blur-md p-6 shadow-sm">
        {children}
      </div>
    </section>
  );
}

function FlightDetailPage() {
  const { flightId } = Route.useParams();
  const flight = useQuery(api.flights.getFlight, {
    flightId: flightId as Id<"flights">,
  });
  const user = useCurrentUser();

  if (flight === undefined) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="h-8 w-24 mb-10" />
        <div className="flex flex-col items-center gap-4 mb-10">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (flight === null) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-border/50 bg-background/70 backdrop-blur-md py-20 text-center shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted/60">
            <Drone className="size-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium">Vol introuvable</p>
            <p className="text-sm text-muted-foreground">
              Ce vol n'existe pas ou n'est plus accessible.
            </p>
          </div>
          <Link to="/flights" className="mt-1">
            <Button variant="outline" className="gap-1.5">
              <ArrowLeft className="size-4" />
              Retour aux vols
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?._id === flight.userId;

  const stats: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
  }> = [];
  if (flight.droneModel) {
    stats.push({ icon: Drone, label: "Drone", value: flight.droneModel });
  }
  if (flight.durationMinutes != null) {
    stats.push({
      icon: Clock,
      label: "Durée",
      value: `${flight.durationMinutes} min`,
    });
  }
  if (flight.maxAltitudeMeters != null) {
    stats.push({
      icon: Mountain,
      label: "Altitude max",
      value: `${flight.maxAltitudeMeters} m`,
    });
  }
  return (
    <div className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
      {/* Hero */}
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        {isOwner ? (
          <Link to="/flights" className="group">
            <OwnerAvatar
              image={flight.owner.image}
              name={flight.owner.name}
              size="lg"
            />
          </Link>
        ) : (
          <Link
            to="/users/$userId"
            params={{ userId: flight.owner._id }}
            className="group"
          >
            <OwnerAvatar
              image={flight.owner.image}
              name={flight.owner.name}
              size="lg"
            />
          </Link>
        )}

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {flight.locationName}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Link
              to="/users/$userId"
              params={{ userId: flight.owner._id }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {flight.owner.name ?? "Pilote"}
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Calendar className="size-2.5" />
              {new Date(flight.date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                flight.isPublic
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted/80 text-muted-foreground"
              }`}
            >
              {flight.isPublic ? (
                <>
                  <Globe className="size-2.5" /> Public
                </>
              ) : (
                <>
                  <Lock className="size-2.5" /> Privé
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            icon={s.icon}
            label={s.label}
            value={s.value}
          />
        ))}
      </div>

      {/* Description */}
      {flight.description && (
        <div className="mb-10">
          <SectionCard icon={FileText} label="Description">
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
              {flight.description}
            </p>
          </SectionCard>
        </div>
      )}

      {/* Media */}
      <div className="mb-10">
        <SectionCard icon={Images} label="Médias">
          <div className="flex flex-col gap-4">
            <MediaPicker
              mode="immediate"
              flightId={flight._id}
              isOwner={isOwner}
            />
          </div>
        </SectionCard>
      </div>

      {/* YouTube */}
      {flight.youtubeUrl &&
        (() => {
          const videoId = getYouTubeVideoId(flight.youtubeUrl);
          if (!videoId) return null;
          return (
            <div className="mb-10">
              <SectionCard icon={Youtube} label="Vidéo YouTube">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="Vidéo du vol"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="absolute inset-0 size-full"
                  />
                </div>
              </SectionCard>
            </div>
          );
        })()}

      {/* Localisation */}
      {flight.latitude != null && flight.longitude != null && (
        <div className="mb-10">
          <SectionCard icon={MapPin} label="Localisation">
            <LocationViewer
              latitude={flight.latitude}
              longitude={flight.longitude}
              locationName={flight.locationName}
            />
          </SectionCard>
        </div>
      )}

      {/* Comments */}
      {flight.allowComments !== false && (
        <div className="mb-10">
          <SectionCard icon={MessageCircle} label="Commentaires">
            <FlightComments
              flightId={flight._id}
              flightOwnerId={flight.userId}
            />
          </SectionCard>
        </div>
      )}

      {/* Delete */}
      {isOwner && (
        <div className="flex justify-center">
          <DeleteFlightDialog />
        </div>
      )}
    </div>
  );
}
