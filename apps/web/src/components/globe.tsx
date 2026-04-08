import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";

interface FlightPoint {
  _id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  date: string;
}

interface GlobeProps {
  flights: FlightPoint[];
}

export default function FlightGlobe({ flights }: GlobeProps) {
  const globeRef = useRef<HTMLDivElement>(null);
  const [GlobeComponent, setGlobeComponent] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    import("react-globe.gl").then((mod) => {
      setGlobeComponent(() => mod.default);
    });
  }, [mounted]);

  const handlePointClick = useCallback(
    (point: any) => {
      navigate({
        to: "/flights/$flightId",
        params: { flightId: point._id },
      });
    },
    [navigate]
  );

  if (!mounted || !GlobeComponent) {
    return (
      <div className="flex items-center justify-center w-full aspect-square max-h-[600px]">
        <Skeleton className="w-full aspect-square max-h-[600px] rounded-full" />
      </div>
    );
  }

  return (
    <div
      ref={globeRef}
      className="flex items-center justify-center w-full"
    >
      <GlobeComponent
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        pointsData={flights}
        pointLat="latitude"
        pointLng="longitude"
        pointColor={() => "#facc15"}
        pointAltitude={0.05}
        pointRadius={0.5}
        pointLabel={(d: FlightPoint) =>
          `<div style="background: rgba(0,0,0,0.8); color: white; padding: 6px 10px; border-radius: 6px; font-size: 13px;">
            <b>${d.locationName}</b><br/>
            <span style="font-size: 11px; opacity: 0.7;">${new Date(d.date).toLocaleDateString("fr-FR")}</span>
          </div>`
        }
        onPointClick={handlePointClick}
        animateIn
        width={typeof window !== "undefined" ? Math.min(window.innerWidth, 700) : 700}
        height={typeof window !== "undefined" ? Math.min(window.innerWidth, 700) : 700}
        atmosphereColor="#3b82f6"
        atmosphereAltitude={0.2}
      />
    </div>
  );
}
