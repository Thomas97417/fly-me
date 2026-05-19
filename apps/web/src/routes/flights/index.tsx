import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import FlightCard from "@/components/flight/flight-card";
import { Drone, Globe, Lock, Clock } from "lucide-react";
import { NewFlyButton } from "@/components/flight/new-fly-button";

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

function FlightsPage() {
  const flights = useQuery(api.flights.listMyFlights);

  if (flights === undefined) {
    return (
      <div className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
        <Skeleton className="h-9 w-48 mb-3" />
        <Skeleton className="h-4 w-64 mb-10" />
        <Skeleton className="h-24 w-full rounded-2xl mb-10" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const publicCount = flights.filter((f) => f.isPublic).length;
  const privateCount = flights.length - publicCount;
  const totalDuration = flights.reduce(
    (sum, f) => sum + (f.durationMinutes ?? 0),
    0,
  );

  return (
    <div className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-1.5">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Drone className="size-3.5" />
          Sorties drone
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Mes Vols</h1>
      </div>

      {flights.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-border/50 bg-background/70 backdrop-blur-md py-20 text-center shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted/60">
            <Drone className="size-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium">Aucun vol enregistré</p>
            <p className="text-sm text-muted-foreground">
              Commencez par ajouter votre première sortie drone.
            </p>
          </div>
          <NewFlyButton />
        </div>
      ) : (
        <>
          {/* Stats + CTA */}
          <div className="mb-10 flex flex-col gap-4 rounded-2xl border border-border/50 bg-background/70 backdrop-blur-md px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <StatBlock label="Vols" value={String(flights.length)} />
              <div className="hidden h-8 w-px bg-border sm:block" />
              <StatBlock
                label="Publics"
                value={String(publicCount)}
                icon={Globe}
              />
              {privateCount > 0 && (
                <>
                  <div className="hidden h-8 w-px bg-border sm:block" />
                  <StatBlock
                    label="Privés"
                    value={String(privateCount)}
                    icon={Lock}
                  />
                </>
              )}
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
            <NewFlyButton />
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
