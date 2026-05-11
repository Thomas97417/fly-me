import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PublicFlightCard from "@/components/public-flight-card";
import { ArrowLeft, User, Drone } from "lucide-react";

export const Route = createFileRoute("/users/$userId")({
  head: () => ({
    meta: [
      { title: "Profil pilote — FlyMe" },
      {
        name: "description",
        content: "Profil public et vols partagés du pilote.",
      },
    ],
  }),
  component: UserProfilePage,
});

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-lg font-semibold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function UserProfilePage() {
  const { userId } = Route.useParams();
  const profile = useQuery(api.flights.getPublicUserProfile, { userId });

  if (profile === undefined) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="flex flex-col items-center gap-6 pb-10">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-7 w-48" />
          <div className="flex gap-8">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <User className="size-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Utilisateur introuvable.</p>
        <Link to="/">
          <Button variant="outline">Retour à la carte</Button>
        </Link>
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
    <div className="container mx-auto max-w-3xl px-4 py-12">
      {/* Back */}
      <Link to="/" className="inline-flex mb-8">
        <Button variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="size-4" />
          Carte
        </Button>
      </Link>

      {/* Hero */}
      <div className="flex flex-col items-center gap-5 pb-10">
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

        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {user.name ?? "Pilote"}
          </h1>
        </div>

        {flights.length > 0 && (
          <div className="flex items-center gap-8">
            <StatBlock label="Vols" value={String(flights.length)} />
            <div className="h-8 w-px bg-border" />
            <StatBlock label="Lieux" value={String(uniqueLocations)} />
            {totalDuration > 0 && (
              <>
                <div className="h-8 w-px bg-border" />
                <StatBlock
                  label="Minutes"
                  value={String(Math.round(totalDuration))}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Flights */}
      {flights.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Drone className="size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            Aucun vol public pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {flights.map((flight) => (
            <PublicFlightCard key={flight._id} flight={flight} />
          ))}
        </div>
      )}
    </div>
  );
}
