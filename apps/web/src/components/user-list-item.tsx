import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";

interface UserListItemProps {
  user: {
    _id: string;
    name: string | null;
    image: string | null;
  };
}

export default function UserListItem({ user }: UserListItemProps) {
  return (
    <Link
      to="/users/$userId"
      params={{ userId: user._id }}
      className="group flex items-center gap-3 rounded-xl border border-border/50 bg-background/70 backdrop-blur-md px-3 py-2 transition-all duration-200 hover:border-primary/40 hover:bg-background/90 hover:shadow-sm"
    >
      <div className="size-9 shrink-0 overflow-hidden rounded-full bg-muted flex items-center justify-center ring-1 ring-border/50">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name ?? ""}
            className="size-full object-cover"
          />
        ) : (
          <User className="size-4 text-muted-foreground" />
        )}
      </div>
      <span className="truncate text-sm font-medium text-foreground/90 transition-colors group-hover:text-foreground">
        {user.name ?? "Pilote"}
      </span>
    </Link>
  );
}
