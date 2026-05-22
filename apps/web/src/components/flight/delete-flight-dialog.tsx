import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TriangleAlert } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Route } from "@/routes/flights/$flightId";
import { useQuery } from "convex/react";

import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";

export function DeleteFlightDialog() {
  const { flightId } = Route.useParams();
  const flight = useQuery(api.flights.getFlight, {
    flightId: flightId as Id<"flights">,
  });
  const deleteFlight = useMutation(api.flights.deleteFlight);
  const navigate = useNavigate();

  async function handleDelete() {
    try {
      await deleteFlight({ flightId: flight!._id });
      toast.success("Vol supprimé.");
      navigate({ to: "/flights" });
    } catch {
      toast.error("Échec de la suppression.");
    }
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
          />
        }
      >
        <Trash2 className="size-4" />
        Supprimer ce vol
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>Supprimer ce vol ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est définitive. Le vol et tous ses médias seront
            supprimés immédiatement.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
