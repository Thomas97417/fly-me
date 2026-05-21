import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import z from "zod";
import { toast } from "sonner";
import {
  MediaPicker,
  IMAGE_TYPES,
  type MediaItem,
} from "@/components/media-picker";
import { Popover } from "@base-ui/react/popover";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { NumberInput } from "@/components/ui/number-input";
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
  Images,
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

const flightSchema = z.object({
  date: z.string().min(1, "La date est requise."),
  locationName: z.string().trim().min(1, "Le lieu est requis."),
  latitude: z
    .union([z.number(), z.undefined()])
    .refine((v): v is number => v !== undefined, {
      message: "Sélectionnez une localisation sur la carte.",
    }),
  longitude: z
    .union([z.number(), z.undefined()])
    .refine((v): v is number => v !== undefined, {
      message: "Sélectionnez une localisation sur la carte.",
    }),
  description: z.string().trim().min(1, "La description est requise."),
  droneModel: z.string(),
  durationMinutes: z.union([z.number(), z.undefined()]),
  maxAltitudeMeters: z.union([z.number(), z.undefined()]),
  isPublic: z.boolean(),
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

function FieldErrors({
  errors,
}: {
  errors: Array<{ message?: string } | undefined>;
}) {
  if (errors.length === 0) return null;
  return (
    <>
      {errors.map((error, i) => (
        <p key={i} className="text-xs text-destructive">
          {error?.message}
        </p>
      ))}
    </>
  );
}

function NewFlightPage() {
  const createFlight = useMutation(api.flights.createFlight);
  const generateUploadUrl = useMutation(api.r2.generateFlightMediaUploadUrl);
  const syncMetadata = useMutation(api.r2.syncMetadata);
  const addFlightMedia = useMutation(api.flightMedia.addFlightMedia);
  const navigate = useNavigate();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  const form = useForm({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      locationName: "",
      latitude: undefined as number | undefined,
      longitude: undefined as number | undefined,
      description: "",
      droneModel: "",
      durationMinutes: undefined as number | undefined,
      maxAltitudeMeters: undefined as number | undefined,
      isPublic: true,
    },
    onSubmit: async ({ value }) => {
      let flightId;
      try {
        flightId = await createFlight({
          date: value.date,
          locationName: value.locationName.trim(),
          latitude: value.latitude,
          longitude: value.longitude,
          description: value.description.trim(),
          droneModel: value.droneModel?.trim() || undefined,
          durationMinutes: value.durationMinutes,
          maxAltitudeMeters: value.maxAltitudeMeters,
          isPublic: value.isPublic,
        });
      } catch {
        toast.error("Échec de la création du vol.");
        return;
      }

      if (mediaItems.length > 0) {
        const results = await Promise.allSettled(
          mediaItems.map(async ({ file }) => {
            const { key, url } = await generateUploadUrl({ flightId });
            await fetch(url, {
              method: "PUT",
              headers: { "Content-Type": file.type },
              body: file,
            });
            await syncMetadata({ key });
            await addFlightMedia({
              flightId,
              r2Key: key,
              mediaType: IMAGE_TYPES.includes(file.type) ? "image" : "video",
              mimeType: file.type,
            });
          }),
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          toast.error(
            failed === 1
              ? "1 média n'a pas pu être uploadé."
              : `${failed} médias n'ont pas pu être uploadés.`,
          );
        }
      }

      toast.success("Vol enregistré !");
      navigate({ to: "/flights/$flightId", params: { flightId } });
    },
    validators: {
      onSubmit: flightSchema,
    },
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col gap-8"
      >
        <FormCard icon={MapPin} label="Localisation">
          <form.Field
            name="locationName"
            children={(field) => (
              <Field htmlFor="locationName" label="Nom du lieu" icon={MapPin}>
                <Input
                  id="locationName"
                  placeholder="ex: Parc de la Tête d'Or, Lyon"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </Field>
            )}
          />

          <form.Subscribe
            selector={(state) => ({
              latitude: state.values.latitude,
              longitude: state.values.longitude,
              latitudeErrors: state.fieldMeta.latitude?.errors ?? [],
            })}
          >
            {(s) => (
              <div className="flex flex-col gap-1.5">
                <LocationPicker
                  latitude={s.latitude}
                  longitude={s.longitude}
                  onCoordinatesChange={(coords) => {
                    form.setFieldValue("latitude", coords.latitude);
                    form.setFieldValue("longitude", coords.longitude);
                  }}
                />
                <FieldErrors errors={s.latitudeErrors} />
              </div>
            )}
          </form.Subscribe>
        </FormCard>

        <FormCard icon={Drone} label="Détails du vol">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <form.Field
              name="date"
              children={(field) => (
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
                          {field.state.value
                            ? format(
                                parseISO(field.state.value),
                                "d MMMM yyyy",
                                {
                                  locale: fr,
                                },
                              )
                            : "Sélectionner une date"}
                        </Button>
                      }
                    />
                    <Popover.Portal>
                      <Popover.Positioner sideOffset={6} align="start">
                        <Popover.Popup className="z-50 rounded-xl border border-border/50 bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95">
                          <Calendar
                            mode="single"
                            selected={
                              field.state.value
                                ? parseISO(field.state.value)
                                : undefined
                            }
                            onSelect={(date) => {
                              if (date) {
                                field.handleChange(format(date, "yyyy-MM-dd"));
                              }
                            }}
                            locale={fr}
                            captionLayout="dropdown"
                          />
                        </Popover.Popup>
                      </Popover.Positioner>
                    </Popover.Portal>
                  </Popover.Root>
                  <FieldErrors errors={field.state.meta.errors} />
                </Field>
              )}
            />

            <form.Field
              name="droneModel"
              children={(field) => (
                <Field
                  htmlFor="droneModel"
                  label="Modèle de drone"
                  icon={Drone}
                >
                  <Input
                    id="droneModel"
                    placeholder="DJI Mini 4 Pro"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldErrors errors={field.state.meta.errors} />
                </Field>
              )}
            />

            <form.Field
              name="durationMinutes"
              children={(field) => (
                <Field htmlFor="duration" label="Durée (min)" icon={Clock}>
                  <NumberInput
                    id="duration"
                    min={0}
                    stepper={1}
                    placeholder="25 min"
                    suffix=" min"
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v)}
                  />
                  <FieldErrors errors={field.state.meta.errors} />
                </Field>
              )}
            />

            <form.Field
              name="maxAltitudeMeters"
              children={(field) => (
                <Field
                  htmlFor="altitude"
                  label="Altitude max (m)"
                  icon={Mountain}
                >
                  <NumberInput
                    id="altitude"
                    min={0}
                    stepper={5}
                    placeholder="120 m"
                    suffix=" m"
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v)}
                  />
                  <FieldErrors errors={field.state.meta.errors} />
                </Field>
              )}
            />
          </div>

          <form.Field
            name="description"
            children={(field) => (
              <Field htmlFor="description" label="Description" icon={FileText}>
                <textarea
                  id="description"
                  placeholder="Notes sur le vol, conditions météo..."
                  rows={4}
                  className="flex w-full rounded-lg border border-input bg-transparent dark:bg-input/30 px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </Field>
            )}
          />
        </FormCard>

        <FormCard icon={Images} label="Médias">
          <MediaPicker
            mode="deferred"
            value={mediaItems}
            onChange={setMediaItems}
          />
        </FormCard>

        <FormCard icon={Globe} label="Visibilité">
          <form.Field
            name="isPublic"
            children={(field) => (
              <label
                htmlFor="isPublic"
                className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 cursor-pointer transition-colors hover:bg-muted/40"
              >
                <Checkbox
                  id="isPublic"
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    Visible sur le globe
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Les autres pilotes pourront voir ce vol sur la carte
                    publique.
                  </span>
                </div>
              </label>
            )}
          />
        </FormCard>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Link to="/flights">
            <Button variant="ghost" type="button">
              Annuler
            </Button>
          </Link>
          <form.Subscribe>
            {(state) => (
              <Button
                type="submit"
                disabled={state.isSubmitting}
                className="gap-1.5"
              >
                {state.isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {state.isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}
