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
  ArrowLeft,
  FileText,
  Images,
} from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";

import OwnerAvatar from "@/components/ui/owner-avatar";
import { DeleteFlightDialog } from "@/components/flight/delete-flight-dialog";

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
  const deleteFlight = useMutation(api.flights.deleteFlight);
  const user = useCurrentUser();
  const navigate = useNavigate();

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

  async function handleDelete() {
    try {
      await deleteFlight({ flightId: flight!._id });
      toast.success("Vol supprimé.");
      navigate({ to: "/flights" });
    } catch {
      toast.error("Échec de la suppression.");
    }
  }

  const stats: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
  }> = [
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
  ];
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
  if (flight.latitude != null && flight.longitude != null) {
    stats.push({
      icon: MapPin,
      label: "Coordonnées",
      value: `${flight.latitude.toFixed(4)}, ${flight.longitude.toFixed(4)}`,
    });
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Back link */}
      <div className="mb-6">
        <Link to="/flights">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
            <ArrowLeft className="size-4" />
            Mes vols
          </Button>
        </Link>
      </div>

      {/* Hero */}
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Drone className="size-3.5" />
          Sortie drone
        </div>

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
          <div className="flex items-center justify-center gap-2.5">
            <Link
              to="/users/$userId"
              params={{ userId: flight.owner._id }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {flight.owner.name ?? "Pilote"}
            </Link>
            <span className="text-muted-foreground/40">·</span>
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
            <MediaGallery flightId={flight._id} isOwner={isOwner} />
            {isOwner && <MediaUpload flightId={flight._id} />}
          </div>
        </SectionCard>
      </div>

      {/* Delete */}
      {isOwner && (
        <div className="flex justify-center">
          <DeleteFlightDialog />
        </div>
      )}
    </div>
  );
}
