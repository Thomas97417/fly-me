import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";

import { useTheme } from "@/components/theme-provider";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? "";

const LIGHT_STYLE = "mapbox://styles/mapbox/light-v11";
const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onCoordinatesChange: (coords: {
    latitude: number;
    longitude: number;
  }) => void;
}

function createMarkerElement() {
  const el = document.createElement("div");
  el.className = "flyme-marker";
  el.innerHTML = `
    <div class="flyme-marker-pin">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-1 1 3 2 2 3 1-1v-3l3-2 3.6 7.4c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/>
      </svg>
    </div>
    <div class="flyme-marker-tail"></div>
  `;
  return el;
}

export default function LocationPicker({
  latitude,
  longitude,
  onCoordinatesChange,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const currentStyleRef = useRef<string | null>(null);
  const { resolvedTheme } = useTheme();

  function placeMarker(lng: number, lat: number, fly = false) {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else {
      markerRef.current = new mapboxgl.Marker({
        element: createMarkerElement(),
        anchor: "bottom",
      })
        .setLngLat([lng, lat])
        .addTo(map);
    }
    if (fly) {
      map.flyTo({ center: [lng, lat], zoom: 13, duration: 1200 });
    }
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const hasInitial = latitude != null && longitude != null;
    const initialStyle =
      resolvedTheme === "dark" ? DARK_STYLE : LIGHT_STYLE;
    currentStyleRef.current = initialStyle;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: initialStyle,
      center: hasInitial ? [longitude!, latitude!] : [2.35, 46.85],
      zoom: hasInitial ? 12 : 4,
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      const roundedLat = Math.round(lat * 1000000) / 1000000;
      const roundedLng = Math.round(lng * 1000000) / 1000000;
      placeMarker(roundedLng, roundedLat);
      onCoordinatesChange({
        latitude: roundedLat,
        longitude: roundedLng,
      });
    });

    mapRef.current = map;

    if (hasInitial) {
      map.on("load", () => placeMarker(longitude!, latitude!));
    }

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

  const hasCoords = latitude != null && longitude != null;

  return (
    <>
      <style>{`
        .flyme-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        }
        .flyme-marker-pin {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: 2.5px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 12px rgba(37, 99, 235, 0.35), 0 1px 4px rgba(0, 0, 0, 0.1);
        }
        .flyme-marker-tail {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #2563eb;
          margin-top: -2px;
          filter: drop-shadow(0 2px 2px rgba(37, 99, 235, 0.2));
        }
      `}</style>

      <div className="relative w-full overflow-hidden rounded-lg border">
        <div ref={containerRef} className="w-full h-72" />

        {/* Hint / coords pill */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          <span className="text-xs px-2.5 py-1 rounded-md bg-background/90 backdrop-blur-sm shadow text-muted-foreground inline-flex items-center gap-1.5">
            <MapPin className="size-3" />
            {hasCoords
              ? `${latitude!.toFixed(4)}, ${longitude!.toFixed(4)}`
              : "Cliquez pour placer un marqueur"}
          </span>
        </div>
      </div>
    </>
  );
}
