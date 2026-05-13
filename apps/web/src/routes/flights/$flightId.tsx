import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import MediaUpload from "@/components/media-upload";
import MediaGallery from "@/components/media-gallery";
import {
  MapPin,
  Calendar,
  Clock,
  Drone,
  Mountain,
  Globe,
  Lock,
  Trash2,
  ArrowLeft,
  User,
} from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";

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

function InfoItem({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-3.5 text-muted-foreground/60 shrink-0" />
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}

function FlightDetailPage() {
  const { flightId } = Route.useParams();
  const flight = useQuery(api.flights.getFlight, {
    flightId: flightId as Id<"flights">,
  });
  const deleteFlight = useMutation(api.flights.deleteFlight);
  const user = useCurrentUser();
  const navigate = useNavigate();

  if (flight === undefined) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="h-8 w-32 mb-10" />
        <div className="flex flex-col items-center gap-4 mb-10">
          <Skeleton className="size-16 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex justify-center gap-6 mb-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (flight === null) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Drone className="size-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Vol introuvable.</p>
        <Link to="/flights">
          <Button variant="outline">Retour aux vols</Button>
        </Link>
      </div>
    );
  }

  const isOwner = user?._id === flight.userId;

  async function handleDelete() {
    if (!confirm("Supprimer ce vol et tous ses médias ?")) return;
    try {
      await deleteFlight({ flightId: flight!._id });
      toast.success("Vol supprimé.");
      navigate({ to: "/flights" });
    } catch {
      toast.error("Échec de la suppression.");
    }
  }

  const infoItems = [
    {
      icon: Calendar,
      label: "Date",
      value: new Date(flight.date).toLocaleDateString("fr-FR", {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
    flight.droneModel
      ? { icon: Drone, label: "Drone", value: flight.droneModel }
      : null,
    flight.durationMinutes != null
      ? { icon: Clock, label: "Durée", value: `${flight.durationMinutes} min` }
      : null,
    flight.maxAltitudeMeters != null
      ? {
          icon: Mountain,
          label: "Altitude max",
          value: `${flight.maxAltitudeMeters} m`,
        }
      : null,
    flight.latitude != null && flight.longitude != null
      ? {
          icon: MapPin,
          label: "Coordonnées",
          value: `${flight.latitude.toFixed(4)}, ${flight.longitude.toFixed(4)}`,
        }
      : null,
  ].filter(Boolean) as Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
  }>;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Top bar */}
      <div className="flex items-center mb-10">
        <Link to="/flights">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="size-4" />
            Mes vols
          </Button>
        </Link>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center gap-4 mb-10 text-center">
        {/* Owner avatar */}
        {isOwner ? (
          <Link to="/flights" className="group">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
              {flight.owner.image ? (
                <img
                  src={flight.owner.image}
                  alt={flight.owner.name ?? ""}
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-6 text-muted-foreground" />
              )}
            </div>
          </Link>
        ) : (
          <Link
            to="/users/$userId"
            params={{ userId: flight.owner._id }}
            className="group"
          >
            <div className="size-14 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
              {flight.owner.image ? (
                <img
                  src={flight.owner.image}
                  alt={flight.owner.name ?? ""}
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-6 text-muted-foreground" />
              )}
            </div>
          </Link>
        )}

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {flight.locationName}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Link
              to="/users/$userId"
              params={{ userId: flight.owner._id }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {flight.owner.name ?? "Pilote"}
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              {flight.isPublic ? (
                <>
                  <Globe className="size-3" /> Public
                </>
              ) : (
                <>
                  <Lock className="size-3" /> Privé
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-8">
        {infoItems.map((item, i) => (
          <div key={item.label} className="flex items-center gap-5">
            {i > 0 && <span className="text-border">·</span>}
            <InfoItem icon={item.icon} value={item.value} />
          </div>
        ))}
      </div>

      {/* Description */}
      {flight.description && (
        <div className="mb-8">
          <h2 className="text-sm font-medium mb-2">Description</h2>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {flight.description}
          </p>
        </div>
      )}

      {/* Media */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Médias</h2>
        </div>
        <MediaGallery flightId={flight._id} isOwner={isOwner} />
        {isOwner && <MediaUpload flightId={flight._id} />}
      </div>

      {/* Delete */}
      {isOwner && (
        <div className="flex justify-center mt-10">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
            Supprimer ce vol
          </Button>
        </div>
      )}
    </div>
  );
}
