import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import LocationPicker from "@/components/location-picker";
import { Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/flights/new")({
  head: () => ({
    meta: [
      { title: "Nouveau Vol — FlyMe" },
      { name: "description", content: "Enregistrez une nouvelle sortie drone." },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: NewFlightPage,
});

function NewFlightPage() {
  const createFlight = useMutation(api.flights.createFlight);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    locationName: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    description: "",
    droneModel: "",
    durationMinutes: "",
    maxAltitudeMeters: "",
    isPublic: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.locationName.trim()) {
      toast.error("Le nom du lieu est requis.");
      return;
    }

    setIsSubmitting(true);
    try {
      const flightId = await createFlight({
        date: form.date,
        locationName: form.locationName.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        description: form.description.trim() || undefined,
        droneModel: form.droneModel.trim() || undefined,
        durationMinutes: form.durationMinutes
          ? parseFloat(form.durationMinutes)
          : undefined,
        maxAltitudeMeters: form.maxAltitudeMeters
          ? parseFloat(form.maxAltitudeMeters)
          : undefined,
        isPublic: form.isPublic,
      });
      toast.success("Vol enregistré !");
      navigate({ to: "/flights/$flightId", params: { flightId } });
    } catch {
      toast.error("Échec de la création du vol.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="flex flex-col gap-1 pb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau Vol</h1>
        <p className="text-muted-foreground text-sm">
          Enregistrez les détails de votre sortie drone.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Localisation</CardTitle>
            <CardDescription>
              Cliquez sur la carte ou utilisez la géolocalisation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LocationPicker
              locationName={form.locationName}
              latitude={form.latitude}
              longitude={form.longitude}
              onLocationChange={(loc) =>
                setForm((prev) => ({
                  ...prev,
                  locationName: loc.locationName,
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                }))
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détails du vol</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="droneModel">Modèle de drone</Label>
              <Input
                id="droneModel"
                placeholder="ex: DJI Mini 4 Pro"
                value={form.droneModel}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, droneModel: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="duration">Durée (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="ex: 25"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      durationMinutes: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="altitude">Altitude max (m)</Label>
                <Input
                  id="altitude"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="ex: 120"
                  value={form.maxAltitudeMeters}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      maxAltitudeMeters: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Notes sur le vol, conditions météo..."
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isPublic"
                checked={form.isPublic}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    isPublic: checked === true,
                  }))
                }
              />
              <Label htmlFor="isPublic" className="text-sm font-normal">
                Visible sur le globe (public)
              </Label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="self-end">
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Save className="size-4" />
              Enregistrer
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
