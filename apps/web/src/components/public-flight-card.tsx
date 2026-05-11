import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Drone,
  Mountain,
  MapPin,
  ArrowRight,
} from "lucide-react";

interface PublicFlightCardProps {
  flight: {
    _id: string;
    date: string;
    locationName: string;
    description?: string;
    droneModel?: string;
    durationMinutes?: number;
    maxAltitudeMeters?: number;
    latitude?: number;
    longitude?: number;
  };
}

function Meta({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Icon className="size-3 shrink-0" />
      {children}
    </span>
  );
}

export default function PublicFlightCard({ flight }: PublicFlightCardProps) {
  return (
    <Link to="/flights/$flightId" params={{ flightId: flight._id }}>
      <Card className="group h-full cursor-pointer transition-all hover:shadow-md hover:border-primary/20">
        <CardHeader>
          <CardTitle className="text-base font-semibold truncate">
            {flight.locationName}
          </CardTitle>
          <CardAction>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(flight.date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
            {flight.droneModel && (
              <Meta icon={Drone}>{flight.droneModel}</Meta>
            )}
            {flight.durationMinutes != null && (
              <Meta icon={Clock}>{flight.durationMinutes} min</Meta>
            )}
            {flight.maxAltitudeMeters != null && (
              <Meta icon={Mountain}>{flight.maxAltitudeMeters} m</Meta>
            )}
            {flight.latitude != null && flight.longitude != null && (
              <Meta icon={MapPin}>
                {flight.latitude.toFixed(2)}, {flight.longitude.toFixed(2)}
              </Meta>
            )}
          </div>

          {flight.description && (
            <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
              {flight.description}
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-0 border-t-0">
          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors inline-flex items-center gap-1">
            Voir le vol
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
