import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FlightCard from "@/components/flight-card";
import { Plus, Drone, Globe, Lock } from "lucide-react";

export const Route = createFileRoute("/flights/")({
  head: () => ({
    meta: [
      { title: "Mes Vols — FlyMe" },
      { name: "description", content: "Consultez et gérez vos sorties drone." },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: FlightsPage,
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
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-lg font-semibold inline-flex items-center gap-1.5">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function FlightsPage() {
  const flights = useQuery(api.flights.listMyFlights);

  if (flights === undefined) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Skeleton className="h-8 w-40 mb-10" />
        <div className="flex justify-center gap-8 mb-10">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const publicCount = flights.filter((f) => f.isPublic).length;
  const totalDuration = flights.reduce(
    (sum, f) => sum + (f.durationMinutes ?? 0),
    0,
  );

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Mes Vols</h1>
          <p className="text-sm text-muted-foreground">
            Vos sorties drone enregistrées
          </p>
        </div>
        <Link to="/flights/new">
          <Button className="gap-1.5">
            <Plus className="size-4" />
            Nouveau vol
          </Button>
        </Link>
      </div>

      {flights.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <Drone className="size-12 text-muted-foreground/40" />
          <div className="flex flex-col gap-1">
            <p className="font-medium">Aucun vol enregistré</p>
            <p className="text-sm text-muted-foreground">
              Commencez par ajouter votre première sortie drone.
            </p>
          </div>
          <Link to="/flights/new" className="mt-2">
            <Button className="gap-1.5">
              <Plus className="size-4" />
              Nouveau vol
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mb-10 py-6 rounded-2xl bg-muted/30">
            <StatBlock label="Vols" value={String(flights.length)} />
            <div className="h-8 w-px bg-border" />
            <StatBlock label="Publics" value={String(publicCount)} icon={Globe} />
            {publicCount < flights.length && (
              <>
                <div className="h-8 w-px bg-border" />
                <StatBlock
                  label="Privés"
                  value={String(flights.length - publicCount)}
                  icon={Lock}
                />
              </>
            )}
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

          {/* Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {flights.map((flight) => (
              <FlightCard key={flight._id} flight={flight} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
