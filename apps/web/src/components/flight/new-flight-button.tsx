import { Link, useRouterState } from "@tanstack/react-router";
import { Authenticated } from "convex/react";
import { Plus } from "lucide-react";

export default function NewFlightButton() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Hide on the new flight page itself
  if (pathname === "/flights/new") return null;

  return (
    <Authenticated>
      <Link
        to="/flights/new"
        aria-label="Nouveau vol"
        className="group absolute bottom-6 right-6 z-20 inline-flex items-center rounded-full bg-primary py-3 pl-3 pr-3 text-primary-foreground shadow-lg shadow-primary/30 ring-1 ring-primary/30 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {/* Slow pulsing halo to draw the eye, killed on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-primary opacity-30 animate-ping [animation-duration:2.5s] group-hover:animate-none group-hover:opacity-0"
        />
        <Plus className="relative size-5 shrink-0 transition-transform duration-300 ease-out group-hover:rotate-90" />
        <span className="relative max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold tracking-tight transition-[max-width,margin] duration-300 ease-out group-hover:ml-2 group-hover:max-w-[160px] group-hover:pr-1">
          Nouveau vol
        </span>
      </Link>
    </Authenticated>
  );
}
