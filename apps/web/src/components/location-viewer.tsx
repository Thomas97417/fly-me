import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";

import { useTheme } from "@/components/theme-provider";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? "";

const LIGHT_STYLE = "mapbox://styles/mapbox/light-v11";
const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

const LIGHT_FOG = {
  color: "rgba(225, 238, 255, 0.95)",
  "high-color": "rgb(155, 195, 240)",
  "horizon-blend": 0.06,
  "space-color": "rgb(232, 240, 252)",
  "star-intensity": 0,
};

const DARK_FOG = {
  color: "rgba(20, 25, 40, 0.9)",
  "high-color": "rgb(36, 50, 80)",
  "horizon-blend": 0.04,
  "space-color": "rgb(8, 10, 20)",
  "star-intensity": 0.6,
};

interface LocationViewerProps {
  latitude: number;
  longitude: number;
  locationName?: string;
}

function createMarkerElement() {
  const el = document.createElement("div");
  el.className = "flyme-marker";
  el.innerHTML = `
    <div class="flyme-marker-pin">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 10 7 7"/>
        <path d="m10 14-3 3"/>
        <path d="m14 10 3-3"/>
        <path d="m14 14 3 3"/>
        <path d="M14.205 4.139a4 4 0 1 1 5.439 5.863"/>
        <path d="M19.637 14a4 4 0 1 1-5.432 5.863"/>
        <path d="M4.367 10a4 4 0 1 1 5.438-5.863"/>
        <path d="M9.795 19.862a4 4 0 1 1-5.429-5.873"/>
        <rect width="4" height="4" x="10" y="10" rx="1"/>
      </svg>
    </div>
    <div class="flyme-marker-tail"></div>
  `;
  return el;
}

export default function LocationViewer({
  latitude,
  longitude,
  locationName,
}: LocationViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const currentStyleRef = useRef<string | null>(null);
  const themeRef = useRef<string | undefined>(undefined);
  const { resolvedTheme } = useTheme();

  themeRef.current = resolvedTheme;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialStyle = resolvedTheme === "dark" ? DARK_STYLE : LIGHT_STYLE;
    currentStyleRef.current = initialStyle;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: initialStyle,
      center: [longitude, latitude],
      zoom: 12,
      attributionControl: false,
      language: "fr",
    });

    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");

    // Re-apply fog after every style load (initial + style swaps)
    map.on("style.load", () => {
      const isDark = themeRef.current === "dark";
      map.setFog((isDark ? DARK_FOG : LIGHT_FOG) as any);
    });

    map.on("load", () => {
      markerRef.current = new mapboxgl.Marker({
        element: createMarkerElement(),
        anchor: "bottom",
      })
        .setLngLat([longitude, latitude])
        .addTo(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch style when theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !resolvedTheme) return;
    const target = resolvedTheme === "dark" ? DARK_STYLE : LIGHT_STYLE;
    if (currentStyleRef.current === target) return;
    currentStyleRef.current = target;
    map.setStyle(target);
  }, [resolvedTheme]);

  return (
    <>
      <style>{`
        .flyme-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .flyme-marker-pin {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 4px 14px rgba(37, 99, 235, 0.45),
            0 2px 4px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          z-index: 2;
        }
        .flyme-marker-pin::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.4);
          z-index: -1;
          pointer-events: none;
          animation: flyme-pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes flyme-pulse {
          0% {
            transform: scale(1);
            opacity: 0;
          }
          15% {
            opacity: 0.55;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
        .flyme-marker-tail {
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 7px solid #2563eb;
          margin-top: -3px;
          filter: drop-shadow(0 2px 3px rgba(37, 99, 235, 0.35));
          z-index: 1;
        }
      `}</style>

      <div className="relative w-full overflow-hidden rounded-lg border">
        <div ref={containerRef} className="w-full h-96 sm:h-[34rem]" />

        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          <span className="text-xs px-2.5 py-1 rounded-md bg-background/90 backdrop-blur-sm shadow text-foreground inline-flex items-center gap-1.5">
            <MapPin className="size-3 shrink-0 text-primary" />
            <span className="">
              {locationName ??
                `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
            </span>
          </span>
        </div>
      </div>
    </>
  );
}
