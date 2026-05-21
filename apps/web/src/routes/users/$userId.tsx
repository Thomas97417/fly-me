import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PublicFlightCard from "@/components/public-flight-card";
import { ArrowLeft, User, Drone, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/users/$userId")({
  head: () => ({
    meta: [
      { title: "Profil — FlyMe" },
      {
        name: "description",
        content: "Profil public et vols partagés du pilote.",
      },
    ],
  }),
  component: UserProfilePage,
});

function StatBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5 text-xl font-semibold tracking-tight">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function UserProfilePage() {
  const { userId } = Route.useParams();
  const profile = useQuery(api.flights.getPublicUserProfile, { userId });

  if (profile === undefined) {
    return (
      <div className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
        <Skeleton className="h-8 w-24 mb-6" />
        <div className="flex flex-col items-center gap-5 pb-10">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-24 w-full rounded-2xl mb-10" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-border/50 bg-background/70 backdrop-blur-md py-20 text-center shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted/60">
            <User className="size-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium">Utilisateur introuvable</p>
            <p className="text-sm text-muted-foreground">
              Ce profil n'existe pas ou n'est plus disponible.
            </p>
          </div>
          <Link to="/" className="mt-1">
            <Button variant="outline" className="gap-1.5">
              <ArrowLeft className="size-4" />
              Retour à la carte
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { user, flights } = profile;

  const totalDuration = flights.reduce(
    (sum, f) => sum + (f.durationMinutes ?? 0),
    0,
  );
  const uniqueLocations = new Set(flights.map((f) => f.locationName)).size;

  return (
    <div className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
      {/* Hero */}
      <div className="mb-10 flex flex-col items-center gap-5 text-center">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <User className="size-3.5" />
          Profil pilote
        </div>
        <div className="size-24 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-4 ring-background shadow-lg">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? ""}
              className="size-full object-cover"
            />
          ) : (
            <User className="size-10 text-muted-foreground" />
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {user.name ?? "Pilote"}
        </h1>
      </div>

      {flights.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-border/50 bg-background/70 backdrop-blur-md py-20 text-center shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted/60">
            <Drone className="size-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium">Aucun vol public</p>
            <p className="text-sm text-muted-foreground">
              Ce pilote n'a pas encore partagé de sortie.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-10 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border border-border/50 bg-background/70 backdrop-blur-md px-6 py-5 shadow-sm">
            <StatBlock
              label="Vols"
              value={String(flights.length)}
              icon={Drone}
            />
            <div className="hidden h-8 w-px bg-border sm:block" />
            <StatBlock
              label="Lieux"
              value={String(uniqueLocations)}
              icon={MapPin}
            />
            {totalDuration > 0 && (
              <>
                <div className="hidden h-8 w-px bg-border sm:block" />
                <StatBlock
                  label="Minutes"
                  value={String(Math.round(totalDuration))}
                  icon={Clock}
                />
              </>
            )}
          </div>

          {/* Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {flights.map((flight) => (
              <PublicFlightCard key={flight._id} flight={flight} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
