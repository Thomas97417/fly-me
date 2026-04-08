import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FlightCard from "@/components/flight-card";
import { Plus, Plane } from "lucide-react";

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

function FlightsPage() {
  const flights = useQuery(api.flights.listMyFlights);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between pb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Mes Vols</h1>
          <p className="text-muted-foreground text-sm">
            Vos sorties drone enregistrées.
          </p>
        </div>
        <Link to="/flights/new">
          <Button>
            <Plus className="size-4" />
            Nouveau vol
          </Button>
        </Link>
      </div>

      {flights === undefined ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : flights.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Plane className="size-12 text-muted-foreground" />
          <div>
            <p className="font-medium">Aucun vol enregistré</p>
            <p className="text-sm text-muted-foreground">
              Commencez par ajouter votre première sortie drone.
            </p>
          </div>
          <Link to="/flights/new">
            <Button>
              <Plus className="size-4" />
              Nouveau vol
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {flights.map((flight) => (
            <FlightCard key={flight._id} flight={flight} />
          ))}
        </div>
      )}
    </div>
  );
}
