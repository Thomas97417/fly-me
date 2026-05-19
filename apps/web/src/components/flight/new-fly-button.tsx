import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function NewFlyButton() {
  return (
    <Link to="/flights/new" className="sm:shrink-0">
      <Button
        size="lg"
        className="w-full gap-2 px-4 shadow-sm transition-all hover:shadow-md hover:shadow-primary/20 sm:w-auto cursor-pointer"
      >
        <Plus className="size-4" />
        Nouveau vol
      </Button>
    </Link>
  );
}
