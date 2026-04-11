import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plane } from "lucide-react";
import FlightGlobe from "@/components/globe";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlyMe — Partagez vos vols drone" },
      {
        name: "description",
        content:
          "Enregistrez vos sorties drone, uploadez photos et vidéos, et explorez les vols du monde entier sur un globe interactif.",
      },
    ],
  }),
  component: HomeComponent,
});

function HomeComponent() {
  const flights = useQuery(api.flights.listPublicFlightLocations) ?? [];

  return (
    <div className="relative flex flex-col items-center h-[calc(100vh-4rem)] overflow-hidden">
      <div className="absolute inset-0">
        <FlightGlobe flights={flights} />
      </div>

      <div className="absolute top-6 left-6 z-10 pointer-events-auto">
        <div className="flex flex-col gap-4 rounded-2xl bg-background/70 backdrop-blur-md px-6 py-5 shadow-lg border border-border/50 max-w-xs">
          <div className="flex items-center gap-2">
            <Plane className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">FlyMe</h1>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Enregistrez vos sorties drone, partagez vos plus belles prises de
            vue et explorez les vols du monde entier.
          </p>

          <div className="flex flex-col gap-2">
            <Authenticated>
              <Link to="/flights/new">
                <Button size="default" className="gap-2 w-full">
                  Nouveau vol
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/flights">
                <Button variant="outline" size="default" className="w-full">
                  Mes vols
                </Button>
              </Link>
            </Authenticated>
            <Unauthenticated>
              <Link to="/sign-up">
                <Button size="default" className="gap-2 w-full">
                  Commencer
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/sign-in">
                <Button variant="outline" size="default" className="w-full">
                  Se connecter
                </Button>
              </Link>
            </Unauthenticated>
          </div>

          {flights.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {flights.length} vol{flights.length > 1 ? "s" : ""} partagé
              {flights.length > 1 ? "s" : ""} dans le monde
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
