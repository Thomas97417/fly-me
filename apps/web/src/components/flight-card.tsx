import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Plane,
  Mountain,
  Globe,
  Lock,
} from "lucide-react";

interface FlightCardProps {
  flight: {
    _id: string;
    date: string;
    locationName: string;
    description?: string;
    droneModel?: string;
    durationMinutes?: number;
    maxAltitudeMeters?: number;
    isPublic: boolean;
  };
}

export default function FlightCard({ flight }: FlightCardProps) {
  return (
    <Link to="/flights/$flightId" params={{ flightId: flight._id }}>
      <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{flight.locationName}</CardTitle>
            {flight.isPublic ? (
              <Globe className="size-4 text-muted-foreground" />
            ) : (
              <Lock className="size-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {new Date(flight.date).toLocaleDateString("fr-FR")}
            </span>
            {flight.droneModel && (
              <span className="flex items-center gap-1">
                <Plane className="size-3.5" />
                {flight.droneModel}
              </span>
            )}
            {flight.durationMinutes !== undefined && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {flight.durationMinutes} min
              </span>
            )}
            {flight.maxAltitudeMeters !== undefined && (
              <span className="flex items-center gap-1">
                <Mountain className="size-3.5" />
                {flight.maxAltitudeMeters} m
              </span>
            )}
          </div>
          {flight.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {flight.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
