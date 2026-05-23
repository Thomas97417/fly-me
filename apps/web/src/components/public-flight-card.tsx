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
import LikeButton from "@/components/like-button";

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
    previews?: Array<{ _id: string; url: string | null }>;
  };
}

function PreviewStrip({
  previews,
}: {
  previews?: Array<{ _id: string; url: string | null }>;
}) {
  const valid = previews?.filter((p) => p.url) ?? [];

  if (valid.length === 0) {
    return (
      <div className="-mt-5 relative flex aspect-video items-center justify-center overflow-hidden bg-linear-to-br from-muted via-muted/70 to-muted/40">
        <Drone className="size-10 text-muted-foreground/30 transition-transform duration-300 group-hover:scale-110" />
      </div>
    );
  }

  return (
    <div
      className="-mt-5 grid aspect-video gap-px bg-border/50"
      style={{ gridTemplateColumns: `repeat(${valid.length}, minmax(0, 1fr))` }}
    >
      {valid.map((p) => (
        <div key={p._id} className="relative overflow-hidden bg-muted">
          <img
            src={p.url!}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      ))}
    </div>
  );
}

function Meta({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2 py-0.5 text-muted-foreground">
      <Icon className="size-3 shrink-0" />
      {children}
    </span>
  );
}

export default function PublicFlightCard({ flight }: PublicFlightCardProps) {
  return (
    <Link to="/flights/$flightId" params={{ flightId: flight._id }}>
      <Card className="group h-full cursor-pointer gap-3 overflow-hidden rounded-2xl border border-border bg-card py-5 ring-0 transition-all duration-200 hover:border-primary/40 hover:shadow-lg dark:hover:shadow-primary/5">
        <PreviewStrip previews={flight.previews} />
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-1.5 text-base font-semibold truncate">
            <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{flight.locationName}</span>
          </CardTitle>
          <CardAction>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Calendar className="size-2.5" />
              {new Date(flight.date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5 text-xs">
            {flight.droneModel && <Meta icon={Drone}>{flight.droneModel}</Meta>}
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

        <CardFooter className="flex items-center justify-between pt-0 border-t-0">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
            Voir le vol
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </span>
          <LikeButton flightId={flight._id} />
        </CardFooter>
      </Card>
    </Link>
  );
}
