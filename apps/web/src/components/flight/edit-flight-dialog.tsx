import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import z from "zod";
import {
  Clock,
  Drone,
  FileText,
  Loader2,
  MapPin,
  Mountain,
  Pencil,
  Save,
  Type,
  X,
} from "lucide-react";

import { api } from "@my-better-t-app/backend/convex/_generated/api";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import LocationPicker from "@/components/location-picker";

interface EditFlightDialogProps {
  flight: {
    _id: Id<"flights">;
    locationName: string;
    description?: string;
    droneModel?: string;
    durationMinutes?: number;
    maxAltitudeMeters?: number;
    latitude?: number;
    longitude?: number;
  };
}

const editFlightSchema = z.object({
  locationName: z.string().trim().min(1, "Le titre est requis."),
  description: z.string(),
  droneModel: z.string(),
  durationMinutes: z.union([z.number(), z.undefined()]),
  maxAltitudeMeters: z.union([z.number(), z.undefined()]),
  latitude: z
    .union([z.number(), z.undefined()])
    .refine((v): v is number => v !== undefined, {
      message: "Sélectionne une localisation sur la carte.",
    }),
  longitude: z
    .union([z.number(), z.undefined()])
    .refine((v): v is number => v !== undefined, {
      message: "Sélectionne une localisation sur la carte.",
    }),
});

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
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        {Icon && <Icon className="size-3.5" />}
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
      {errors.map((err) => (
        <p key={err?.message} className="text-xs text-destructive">
          {err?.message}
        </p>
      ))}
    </>
  );
}

export default function EditFlightDialog({ flight }: EditFlightDialogProps) {
  const [open, setOpen] = useState(false);
  const updateFlight = useMutation(api.flights.updateFlight);

  const form = useForm({
    defaultValues: {
      locationName: flight.locationName,
      description: flight.description ?? "",
      droneModel: flight.droneModel ?? "",
      durationMinutes: flight.durationMinutes as number | undefined,
      maxAltitudeMeters: flight.maxAltitudeMeters as number | undefined,
      latitude: flight.latitude as number | undefined,
      longitude: flight.longitude as number | undefined,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateFlight({
          flightId: flight._id,
          locationName: value.locationName.trim(),
          description: value.description.trim() || undefined,
          droneModel: value.droneModel.trim() || undefined,
          durationMinutes: value.durationMinutes,
          maxAltitudeMeters: value.maxAltitudeMeters,
          latitude: value.latitude,
          longitude: value.longitude,
        });
        toast.success("Vol mis à jour.");
        setOpen(false);
      } catch {
        toast.error("Échec de la mise à jour.");
      }
    },
    validators: {
      onSubmit: editFlightSchema,
    },
  });

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          // Reset form to current flight values whenever we re-open
          form.reset();
        }
      }}
    >
      <Dialog.Trigger
        render={
          <button
            type="button"
            aria-label="Modifier le vol"
            className="inline-flex min-w-8 cursor-pointer items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 duration-150" />
        <Dialog.Popup
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl outline-none data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-border/50 px-6 py-4">
            <Dialog.Title className="text-base font-semibold tracking-tight">
              Modifier le vol
            </Dialog.Title>
            <Dialog.Close
              render={
                <button
                  type="button"
                  aria-label="Fermer"
                  className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                />
              }
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          {/* Body */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <form.Field
                name="locationName"
                children={(field) => (
                  <Field htmlFor="edit-locationName" label="Titre" icon={Type}>
                    <Input
                      id="edit-locationName"
                      placeholder="Lac d'Annecy, Mont-Blanc…"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldErrors errors={field.state.meta.errors} />
                  </Field>
                )}
              />

              <form.Field
                name="description"
                children={(field) => (
                  <Field
                    htmlFor="edit-description"
                    label="Description"
                    icon={FileText}
                  >
                    <textarea
                      id="edit-description"
                      placeholder="Notes sur le vol, conditions météo..."
                      rows={3}
                      className="flex w-full rounded-lg border border-input bg-transparent dark:bg-input/30 px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldErrors errors={field.state.meta.errors} />
                  </Field>
                )}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <form.Field
                  name="droneModel"
                  children={(field) => (
                    <Field
                      htmlFor="edit-droneModel"
                      label="Modèle de drone"
                      icon={Drone}
                    >
                      <Input
                        id="edit-droneModel"
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
                    <Field
                      htmlFor="edit-duration"
                      label="Durée (min)"
                      icon={Clock}
                    >
                      <NumberInput
                        id="edit-duration"
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
                      htmlFor="edit-altitude"
                      label="Altitude max (m)"
                      icon={Mountain}
                    >
                      <NumberInput
                        id="edit-altitude"
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

              <Field htmlFor="edit-location" label="Position" icon={MapPin}>
                <form.Field
                  name="latitude"
                  children={(latField) => (
                    <form.Field
                      name="longitude"
                      children={(lngField) => (
                        <>
                          <LocationPicker
                            latitude={latField.state.value}
                            longitude={lngField.state.value}
                            onCoordinatesChange={(coords) => {
                              latField.handleChange(coords.latitude);
                              lngField.handleChange(coords.longitude);
                            }}
                          />
                          <FieldErrors
                            errors={[
                              ...latField.state.meta.errors,
                              ...lngField.state.meta.errors,
                            ]}
                          />
                        </>
                      )}
                    />
                  )}
                />
              </Field>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border/50 bg-muted/30 px-6 py-3">
              <Dialog.Close
                render={
                  <Button type="button" variant="ghost" size="sm">
                    Annuler
                  </Button>
                }
              />
              <form.Subscribe>
                {(state) => (
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!state.canSubmit || state.isSubmitting}
                    className="gap-1.5"
                  >
                    {state.isSubmitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Enregistrer
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
