import { useState, useCallback } from "react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import type {
  Id,
  Doc,
} from "@my-better-t-app/backend/convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import FlightGlobe from "@/components/globe";
import FlightPreviewCard from "@/components/flight-preview-card";
import WelcomeCard from "@/components/home/welcome-card";

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
  const [selectedFlightId, setSelectedFlightId] =
    useState<Id<"flights"> | null>(null);

  const handleFlightClick = useCallback((flightId: string | null) => {
    setSelectedFlightId(flightId as Id<"flights"> | null);
  }, []);

  const flightPreview = useQuery(
    api.flights.getPublicFlightPreview,
    selectedFlightId ? { flightId: selectedFlightId } : "skip",
  );

  return (
    <div className="relative flex flex-col items-center h-svh overflow-hidden">
      <div className="absolute inset-0">
        <FlightGlobe flights={flights} onFlightClick={handleFlightClick} />
      </div>
      <WelcomeCard flights={flights as Doc<"flights">[]} />
      {selectedFlightId && (
        <div className="absolute top-20 right-6 z-10 pointer-events-auto">
          <FlightPreviewCard
            flightId={selectedFlightId}
            data={flightPreview}
            onClose={() => setSelectedFlightId(null)}
          />
        </div>
      )}
    </div>
  );
}
