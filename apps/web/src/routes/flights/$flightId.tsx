import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  MessageCircle,
} from "lucide-react";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";

import OwnerAvatar from "@/components/ui/owner-avatar";
import { DeleteFlightDialog } from "@/components/flight/delete-flight-dialog";
import EditFlightDialog from "@/components/flight/edit-flight-dialog";
import FlightComments from "@/components/flight/flight-comments";
import FlightBento from "@/components/flight/flight-bento";
import LikeButton from "@/components/like-button";
import BookmarkButton from "@/components/bookmark-button";

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

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 shadow-md backdrop-blur-md">
      <Icon
        className="size-3.5 text-muted-foreground"
        aria-label={label}
      />
      <span className="text-xs font-semibold tracking-tight">{value}</span>
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
      <div className="container mx-auto max-w-5xl px-4 pt-24 pb-16">
        {/* Hero skeleton */}
        <div className="mb-8 flex items-center gap-4">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        {/* Info row skeleton */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-2xl sm:col-span-2" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        </div>
        {/* Bento skeleton */}
        <div className="mb-10 grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[clamp(140px,20vw,200px)] grid-flow-dense">
          <Skeleton className="col-span-2 row-span-2 rounded-2xl" />
          <Skeleton className="rounded-2xl" />
          <Skeleton className="rounded-2xl" />
          <Skeleton className="col-span-2 rounded-2xl" />
        </div>
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
  const youtubeVideoId = flight.youtubeUrl
    ? getYouTubeVideoId(flight.youtubeUrl)
    : null;

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

  const statsOverlay =
    stats.length > 0 ? (
      <>
        {stats.map((s) => (
          <StatPill
            key={s.label}
            icon={s.icon}
            label={s.label}
            value={s.value}
          />
        ))}
      </>
    ) : null;

  return (
    <div className="container mx-auto max-w-5xl px-4 pt-24 pb-16">
      {/* Hero — compact, left-aligned */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          to="/users/$userId"
          params={{ userId: flight.owner._id }}
          className="group shrink-0"
          aria-label={`Profil de ${flight.owner.name ?? "Pilote"}`}
        >
          <OwnerAvatar
            image={flight.owner.image}
            name={flight.owner.name}
            size="md"
          />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
            {flight.locationName}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <Link
              to="/users/$userId"
              params={{ userId: flight.owner._id }}
              className="hover:text-primary transition-colors"
            >
              {flight.owner.name ?? "Pilote"}
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" />
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

        {/* Actions — bookmark + like (+ edit for owner) */}
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-background/70 p-1 shadow-sm backdrop-blur-md">
          <BookmarkButton flightId={flight._id} />
          <div className="h-5 w-px bg-border/60" />
          <LikeButton flightId={flight._id} />
          {isOwner && (
            <>
              <div className="h-5 w-px bg-border/60" />
              <EditFlightDialog flight={flight} />
            </>
          )}
        </div>
      </div>

      {/* Bento — media + YouTube + add tile, with stat pills overlaid */}
      <div className="mb-10">
        <FlightBento
          flightId={flight._id}
          isOwner={isOwner}
          youtubeVideoId={youtubeVideoId}
          overlay={statsOverlay}
        />
      </div>

      {/* Description (below the bento) */}
      {flight.description && (
        <div className="mb-10">
          <SectionCard icon={FileText} label="Description">
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
              {flight.description}
            </p>
          </SectionCard>
        </div>
      )}

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
