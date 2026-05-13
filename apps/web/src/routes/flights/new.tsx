import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Popover } from "@base-ui/react/popover";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import LocationPicker from "@/components/location-picker";
import {
  Loader2,
  Save,
  ArrowLeft,
  Calendar as CalendarIcon,
  Drone,
  Clock,
  Mountain,
  FileText,
  Globe,
  MapPin,
  Plus,
} from "lucide-react";

export const Route = createFileRoute("/flights/new")({
  head: () => ({
    meta: [
      { title: "Nouveau Vol — FlyMe" },
      {
        name: "description",
        content: "Enregistrez une nouvelle sortie drone.",
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: NewFlightPage,
});

function FormCard({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="inline-flex items-center gap-2 px-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="flex flex-col gap-5 rounded-2xl border border-border/50 bg-background/70 backdrop-blur-md p-6 shadow-sm">
        {children}
      </div>
    </section>
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
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Back link */}
      <div className="mb-6">
        <Link to="/flights">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
            <ArrowLeft className="size-4" />
            Mes vols
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-10 flex flex-col gap-1.5">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Plus className="size-3.5" />
          Nouvelle sortie
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Nouveau vol</h1>
        <p className="text-sm text-muted-foreground">
          Enregistrez les détails de votre sortie drone.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <FormCard icon={MapPin} label="Localisation">
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
        </FormCard>

        <FormCard icon={Drone} label="Détails du vol">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field htmlFor="date" label="Date" icon={CalendarIcon}>
              <Popover.Root>
                <Popover.Trigger
                  render={
                    <Button
                      id="date"
                      type="button"
                      variant="outline"
                      className="w-full justify-start font-normal"
                    >
                      <CalendarIcon className="size-3.5 text-muted-foreground" />
                      {form.date
                        ? format(parseISO(form.date), "d MMMM yyyy", {
                            locale: fr,
                          })
                        : "Sélectionner une date"}
                    </Button>
                  }
                />
                <Popover.Portal>
                  <Popover.Positioner sideOffset={6} align="start">
                    <Popover.Popup className="z-50 rounded-xl border border-border/50 bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95">
                      <Calendar
                        mode="single"
                        selected={form.date ? parseISO(form.date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setForm((prev) => ({
                              ...prev,
                              date: format(date, "yyyy-MM-dd"),
                            }));
                          }
                        }}
                        locale={fr}
                        captionLayout="dropdown"
                      />
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
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
              className="flex w-full rounded-lg border border-input bg-transparent dark:bg-input/30 px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </Field>
        </FormCard>

        <FormCard icon={Globe} label="Visibilité">
          <label
            htmlFor="isPublic"
            className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 cursor-pointer transition-colors hover:bg-muted/40"
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
        </FormCard>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-2">
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
