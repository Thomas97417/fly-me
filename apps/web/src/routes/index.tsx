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
    <div className="flex flex-col items-center">
      <section className="relative flex w-full flex-col items-center gap-6 px-4 pt-12 pb-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-primary/5 absolute top-1/2 left-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
        </div>

        <div className="relative flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Plane className="size-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              FlyMe
            </h1>
          </div>
          <p className="text-muted-foreground max-w-md text-center text-base leading-relaxed">
            Enregistrez vos sorties drone, partagez vos plus belles prises de
            vue et explorez les vols du monde entier.
          </p>
        </div>

        <div className="relative flex gap-3">
          <Authenticated>
            <Link to="/flights/new">
              <Button size="lg" className="gap-2">
                Nouveau vol
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/flights">
              <Button variant="outline" size="lg">
                Mes vols
              </Button>
            </Link>
          </Authenticated>
          <Unauthenticated>
            <Link to="/sign-up">
              <Button size="lg" className="gap-2">
                Commencer
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/sign-in">
              <Button variant="outline" size="lg">
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
      </section>

      <section className="w-full flex justify-center px-4 pb-16">
        <FlightGlobe flights={flights} />
      </section>
    </div>
  );
}
