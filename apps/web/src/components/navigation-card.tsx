import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";

import { useCurrentUser } from "@/hooks/use-current-user";
import UserMenu from "./user-menu";
import { ModeToggle } from "./mode-toggle";

const linkStyles =
  "text-sm text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:font-medium";

function GuestAvatar() {
  return (
    <Link
      to="/sign-in"
      className="size-8 rounded-full bg-muted flex items-center justify-center"
    >
      <User className="size-4 text-muted-foreground" />
    </Link>
  );
}

function ProfileLink() {
  const user = useCurrentUser();
  if (!user) return null;
  return (
    <Link
      to="/users/$userId"
      params={{ userId: user._id }}
      className={linkStyles}
    >
      Mon profil
    </Link>
  );
}

export default function NavigationCard() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="absolute top-6 right-6 z-20 pointer-events-auto">
      <div className="flex items-center gap-2 rounded-2xl bg-background/70 backdrop-blur-md px-3 py-2 shadow-lg border border-border/50 transition-all duration-200 h-12">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>

        {expanded ? (
          <>
            <nav className="flex items-center gap-4">
              <Link
                to="/"
                className={linkStyles}
                activeOptions={{ exact: true }}
              >
                Globe
              </Link>
              <Authenticated>
                <ProfileLink />
                <Link to="/subscriptions" className={linkStyles}>
                  Abonnements
                </Link>
                <Link to="/bookmarks" className={linkStyles}>
                  Mes favoris
                </Link>
              </Authenticated>
            </nav>

            <div className="flex items-center gap-2">
              <ModeToggle />
              <Authenticated>
                <UserMenu />
              </Authenticated>
              <Unauthenticated>
                <GuestAvatar />
              </Unauthenticated>
            </div>
          </>
        ) : (
          <>
            <Authenticated>
              <UserMenu />
            </Authenticated>
            <Unauthenticated>
              <GuestAvatar />
            </Unauthenticated>
          </>
        )}
      </div>
    </div>
  );
}
