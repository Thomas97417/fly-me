import { Link, useRouterState } from "@tanstack/react-router";
import { Authenticated } from "convex/react";
import { Plus } from "lucide-react";

export default function NewFlightBubble() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Hide on the new flight page itself
  if (pathname === "/flights/new") return null;

  return (
    <Authenticated>
      <Link
        to="/flights/new"
        aria-label="Nouveau vol"
        className="group absolute bottom-6 right-6 z-20 flex size-12 items-center justify-center rounded-full border border-border/50 bg-background/70 text-primary shadow-lg backdrop-blur-md transition-all duration-200 hover:border-primary/40 hover:bg-background/80 hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group-hover:scale-110"
      >
        <Plus className="size-5 transition-transform duration-300" />
      </Link>
    </Authenticated>
  );
}
