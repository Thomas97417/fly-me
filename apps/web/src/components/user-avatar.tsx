import { forwardRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { User } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

type UserAvatarProps = React.ComponentPropsWithoutRef<"div">;

const UserAvatar = forwardRef<HTMLDivElement, UserAvatarProps>(
  ({ className, ...props }, ref) => {
    const user = useCurrentUser();
    const metadata = useQuery(
      api.r2.getMetadata,
      user?.image && !user.image.startsWith("http")
        ? { key: user.image }
        : "skip",
    );

    const imageUrl = user?.image?.startsWith("http")
      ? user.image
      : metadata?.url ?? null;

    return (
      <div
        ref={ref}
        {...props}
        className={cn(
          "rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer outline-none",
          className ?? "size-8",
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={user?.name ?? ""}
            className="size-full object-cover"
          />
        ) : (
          <User className="size-4 text-muted-foreground" />
        )}
      </div>
    );
  },
);

UserAvatar.displayName = "UserAvatar";

export default UserAvatar;
