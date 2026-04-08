import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, LocateFixed, Loader2 } from "lucide-react";

interface LocationPickerProps {
  locationName: string;
  latitude?: number;
  longitude?: number;
  onLocationChange: (location: {
    locationName: string;
    latitude?: number;
    longitude?: number;
  }) => void;
}

export default function LocationPicker({
  locationName,
  latitude,
  longitude,
  onLocationChange,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    async function initMap() {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapRef.current) return;

      const defaultLat = latitude ?? 48.8566;
      const defaultLng = longitude ?? 2.3522;

      const map = L.map(mapRef.current).setView(
        [defaultLat, defaultLng],
        latitude ? 13 : 5
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.icon({
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      if (latitude && longitude) {
        markerRef.current = L.marker([latitude, longitude], { icon }).addTo(
          map
        );
      }

      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
        }
        onLocationChange({
          locationName,
          latitude: Math.round(lat * 1000000) / 1000000,
          longitude: Math.round(lng * 1000000) / 1000000,
        });
      });

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [mounted]);

  function handleGeolocate() {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1000000) / 1000000;
        const lng = Math.round(pos.coords.longitude * 1000000) / 1000000;
        onLocationChange({ locationName, latitude: lat, longitude: lng });

        if (mapInstanceRef.current) {
          const L = (window as any).L;
          mapInstanceRef.current.setView([lat, lng], 13);
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else if (L) {
            markerRef.current = L.marker([lat, lng]).addTo(
              mapInstanceRef.current
            );
          }
        }
        setIsLocating(false);
      },
      () => setIsLocating(false)
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="locationName">
          <MapPin className="inline size-4 mr-1" />
          Nom du lieu
        </Label>
        <Input
          id="locationName"
          placeholder="ex: Parc de la Tête d'Or, Lyon"
          value={locationName}
          onChange={(e) =>
            onLocationChange({
              locationName: e.target.value,
              latitude,
              longitude,
            })
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGeolocate}
          disabled={isLocating}
        >
          {isLocating ? (
            <Loader2 className="size-4 animate-spin mr-1" />
          ) : (
            <LocateFixed className="size-4 mr-1" />
          )}
          Ma position
        </Button>
        {latitude !== undefined && longitude !== undefined && (
          <span className="text-xs text-muted-foreground">
            {latitude}, {longitude}
          </span>
        )}
      </div>

      {mounted && (
        <div
          ref={mapRef}
          className="h-64 w-full rounded-lg border overflow-hidden"
        />
      )}

      <p className="text-xs text-muted-foreground">
        Cliquez sur la carte pour placer le marqueur.
      </p>
    </div>
  );
}
