import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import MediaUpload from "@/components/media-upload";
import MediaGallery from "@/components/media-gallery";
import {
  MapPin,
  Calendar,
  Clock,
  Plane,
  Mountain,
  Globe,
  Lock,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";

export const Route = createFileRoute("/flights/$flightId")({
  head: () => ({
    meta: [
      { title: "Détail du Vol — FlyMe" },
      { name: "description", content: "Détails et médias de la sortie drone." },
    ],
  }),
  component: FlightDetailPage,
});

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
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (flight === null) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-muted-foreground">Vol introuvable.</p>
        <Link to="/flights" className="text-sm underline mt-2 inline-block">
          Retour aux vols
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

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-4 pb-8">
        <Link to="/flights">
          <Button variant="ghost" size="icon-xs">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {flight.locationName}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {flight.isPublic ? (
              <Globe className="size-3.5" />
            ) : (
              <Lock className="size-3.5" />
            )}
            {flight.isPublic ? "Public" : "Privé"}
          </div>
        </div>
        {isOwner && (
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="size-4" />
            Supprimer
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <span>
                  {new Date(flight.date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              {flight.latitude !== undefined &&
                flight.longitude !== undefined && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span>
                      {flight.latitude}, {flight.longitude}
                    </span>
                  </div>
                )}
              {flight.droneModel && (
                <div className="flex items-center gap-2">
                  <Plane className="size-4 text-muted-foreground" />
                  <span>{flight.droneModel}</span>
                </div>
              )}
              {flight.durationMinutes !== undefined && (
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>{flight.durationMinutes} min</span>
                </div>
              )}
              {flight.maxAltitudeMeters !== undefined && (
                <div className="flex items-center gap-2">
                  <Mountain className="size-4 text-muted-foreground" />
                  <span>{flight.maxAltitudeMeters} m</span>
                </div>
              )}
            </div>
            {flight.description && (
              <p className="mt-4 text-sm text-muted-foreground">
                {flight.description}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Médias</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {isOwner && <MediaUpload flightId={flight._id} />}
            <MediaGallery flightId={flight._id} isOwner={isOwner} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
