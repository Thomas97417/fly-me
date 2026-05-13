import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LogOut, Settings, Drone, UserRound, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

import UserAvatar from "./user-avatar";

export default function UserMenu() {
  const user = useCurrentUser();
  const navigate = useNavigate();

  const metadata = useQuery(
    api.r2.getMetadata,
    user?.image && !user.image.startsWith("http")
      ? { key: user.image }
      : "skip",
  );

  const imageUrl = user?.image?.startsWith("http")
    ? user.image
    : (metadata?.url ?? null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <UserAvatar className="size-8 ring-2 ring-transparent transition-all hover:ring-primary/30 data-[popup-open]:ring-primary/40" />
        }
      />
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-64 rounded-2xl border border-border/50 bg-background/95 p-1.5 shadow-lg backdrop-blur-md"
      >
        {/* User header */}
        <div className="flex items-center gap-3 px-2.5 py-2.5">
          <div className="size-10 shrink-0 overflow-hidden rounded-full bg-muted flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={user?.name ?? ""}
                className="size-full object-cover"
              />
            ) : (
              <User className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-sm font-medium leading-tight">
              {user?.name}
            </p>
            <p className="truncate text-xs text-muted-foreground leading-tight mt-0.5">
              {user?.email}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          className="cursor-pointer rounded-lg px-2.5 py-2 text-xs"
          onClick={() =>
            user &&
            navigate({ to: "/users/$userId", params: { userId: user._id } })
          }
        >
          <UserRound className="mr-2 size-4 text-muted-foreground" />
          Mon Profil
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer rounded-lg px-2.5 py-2 text-xs"
          onClick={() => navigate({ to: "/flights" })}
        >
          <Drone className="mr-2 size-4 text-muted-foreground" />
          Mes Vols
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer rounded-lg px-2.5 py-2 text-xs"
          onClick={() => navigate({ to: "/settings" })}
        >
          <Settings className="mr-2 size-4 text-muted-foreground" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer rounded-lg px-2.5 py-2 text-xs"
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  navigate({ to: "/" });
                },
              },
            });
          }}
        >
          <LogOut className="mr-2 size-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
