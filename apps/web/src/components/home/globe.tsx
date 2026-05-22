import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { useTheme } from "@/components/theme-provider";

interface FlightPoint {
  _id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  date: string;
}

interface GlobeProps {
  flights: FlightPoint[];
  onFlightClick?: (flightId: string | null) => void;
}

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

export default function FlightGlobe({ flights, onFlightClick }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const spinRef = useRef<number | null>(null);
  const userInteractingRef = useRef(false);
  const currentStyleRef = useRef<string | null>(null);
  const themeRef = useRef<string | undefined>(undefined);
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();

  // Keep latest theme accessible from inside the map's style.load listener
  themeRef.current = resolvedTheme;

  const navigateToFlight = useCallback(
    (flightId: string) => {
      navigate({
        to: "/flights/$flightId",
        params: { flightId },
      });
    },
    [navigate],
  );

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialStyle = themeRef.current === "dark" ? DARK_STYLE : LIGHT_STYLE;
    currentStyleRef.current = initialStyle;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: initialStyle,
      projection: "globe",
      center: [2.35, 46.85],
      zoom: 2.2,
      minZoom: 1.5,
      maxZoom: 12,
      interactive: true,
      dragRotate: true,
      scrollZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
      pitchWithRotate: false,
      touchZoomRotate: true,
      keyboard: false,
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    // Re-apply fog after every style load (initial + style swaps)
    map.on("style.load", () => {
      const isDark = themeRef.current === "dark";
      map.setFog((isDark ? DARK_FOG : LIGHT_FOG) as any);
    });

    // Auto-rotation
    const spinGlobe = () => {
      if (userInteractingRef.current || !mapRef.current) return;
      const center = map.getCenter();
      center.lng += 0.015;
      map.setCenter(center);
      spinRef.current = requestAnimationFrame(spinGlobe);
    };

    const stopSpin = () => {
      userInteractingRef.current = true;
      if (spinRef.current) cancelAnimationFrame(spinRef.current);
    };

    map.on("mousedown", stopSpin);
    map.on("touchstart", stopSpin);
    map.on("wheel", stopSpin);
    map.on("zoomstart", stopSpin);

    map.on("click", () => {
      if (onFlightClick) onFlightClick(null);
    });

    map.on("load", () => {
      spinRef.current = requestAnimationFrame(spinGlobe);
    });

    mapRef.current = map;

    return () => {
      if (spinRef.current) cancelAnimationFrame(spinRef.current);
      map.remove();
      mapRef.current = null;
    };
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

  // Sync markers with flights
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const addMarkers = () => {
      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      flights.forEach((flight) => {
        // Marker element
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

        // Popup
        const popup = new mapboxgl.Popup({
          offset: 28,
          closeButton: false,
          closeOnClick: false,
          className: "flyme-popup",
          maxWidth: "220px",
        }).setHTML(
          `<div class="flyme-popup-body">
            <div class="flyme-popup-title">${flight.locationName}</div>
            <div class="flyme-popup-date">${new Date(flight.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</div>
          </div>`,
        );

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat([flight.longitude, flight.latitude])
          .setPopup(popup)
          .addTo(map);

        // Show popup on hover
        el.addEventListener("mouseenter", () => marker.togglePopup());
        el.addEventListener("mouseleave", () => marker.togglePopup());
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          if (onFlightClick) {
            onFlightClick(flight._id);
          } else {
            navigateToFlight(flight._id);
          }
        });

        markersRef.current.push(marker);
      });
    };

    if (map.loaded()) {
      addMarkers();
    } else {
      map.on("load", addMarkers);
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [flights, navigateToFlight, onFlightClick]);

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
          transition:
            transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.25s ease;
          z-index: 2;
          will-change: transform;
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
        .flyme-marker:hover .flyme-marker-pin {
          transform: scale(1.2);
          box-shadow:
            0 8px 26px rgba(37, 99, 235, 0.6),
            0 4px 10px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.35);
        }
        .flyme-marker:hover .flyme-marker-pin::before {
          animation-play-state: paused;
          opacity: 0;
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
        .flyme-popup .mapboxgl-popup-content {
          background: var(--popover);
          color: var(--popover-foreground);
          border-radius: 12px;
          padding: 10px 14px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18), 0 1px 4px rgba(0, 0, 0, 0.08);
          border: 1px solid var(--border);
        }
        .flyme-popup-body {
          font-family: Inter, system-ui, sans-serif;
        }
        .flyme-popup-title {
          font-weight: 600;
          font-size: 14px;
          color: var(--foreground);
        }
        .flyme-popup-date {
          font-size: 12px;
          color: var(--muted-foreground);
          margin-top: 2px;
        }
        .flyme-popup .mapboxgl-popup-anchor-top .mapboxgl-popup-tip { border-bottom-color: var(--popover); }
        .flyme-popup .mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip { border-top-color: var(--popover); }
        .flyme-popup .mapboxgl-popup-anchor-left .mapboxgl-popup-tip { border-right-color: var(--popover); }
        .flyme-popup .mapboxgl-popup-anchor-right .mapboxgl-popup-tip { border-left-color: var(--popover); }
        .mapboxgl-ctrl-attrib {
          opacity: 0.4;
          font-size: 10px !important;
        }
      `}</style>
      <div ref={containerRef} className="w-full h-full min-h-[600px]" />
    </>
  );
}
