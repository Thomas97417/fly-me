import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import LocationPicker from "@/components/location-picker";
import {
  Loader2,
  Save,
  ArrowLeft,
  Calendar,
  Drone,
  Clock,
  Mountain,
  FileText,
  Globe,
} from "lucide-react";

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

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-medium">
      <Icon className="size-4 text-muted-foreground" />
      {children}
    </h2>
  );
}

function Field({
  htmlFor,
  label,
  icon: Icon,
  children,
}: {
  htmlFor: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={htmlFor}
        className="text-xs font-medium inline-flex items-center gap-1.5"
      >
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        {label}
      </Label>
      {children}
    </div>
  );
}

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
    <div className="container mx-auto max-w-3xl px-4 py-12">
      {/* Top bar */}
      <div className="flex items-center mb-8">
        <Link to="/flights">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="size-4" />
            Mes vols
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-1 mb-10">
        <h1 className="text-2xl font-bold tracking-tight">Nouveau vol</h1>
        <p className="text-sm text-muted-foreground">
          Enregistrez les détails de votre sortie drone.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        {/* Location */}
        <section className="flex flex-col gap-4">
          <SectionTitle icon={Globe}>Localisation</SectionTitle>
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
        </section>

        {/* Details */}
        <section className="flex flex-col gap-4">
          <SectionTitle icon={Drone}>Détails du vol</SectionTitle>

          <div className="grid grid-cols-2 gap-3">
            <Field htmlFor="date" label="Date" icon={Calendar}>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </Field>
            <Field htmlFor="droneModel" label="Modèle de drone" icon={Drone}>
              <Input
                id="droneModel"
                placeholder="DJI Mini 4 Pro"
                value={form.droneModel}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    droneModel: e.target.value,
                  }))
                }
              />
            </Field>
            <Field htmlFor="duration" label="Durée (min)" icon={Clock}>
              <Input
                id="duration"
                type="number"
                min="0"
                step="1"
                placeholder="25"
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    durationMinutes: e.target.value,
                  }))
                }
              />
            </Field>
            <Field htmlFor="altitude" label="Altitude max (m)" icon={Mountain}>
              <Input
                id="altitude"
                type="number"
                min="0"
                step="1"
                placeholder="120"
                value={form.maxAltitudeMeters}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    maxAltitudeMeters: e.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <Field htmlFor="description" label="Description" icon={FileText}>
            <textarea
              id="description"
              placeholder="Notes sur le vol, conditions météo..."
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </Field>
        </section>

        {/* Visibility */}
        <section className="flex flex-col gap-4">
          <SectionTitle icon={Globe}>Visibilité</SectionTitle>
          <label
            htmlFor="isPublic"
            className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              id="isPublic"
              checked={form.isPublic}
              onCheckedChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  isPublic: checked === true,
                }))
              }
              className="mt-0.5"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Visible sur le globe</span>
              <span className="text-xs text-muted-foreground">
                Les autres pilotes pourront voir ce vol sur la carte publique.
              </span>
            </div>
          </label>
        </section>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Link to="/flights">
            <Button variant="ghost" type="button">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting} className="gap-1.5">
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
