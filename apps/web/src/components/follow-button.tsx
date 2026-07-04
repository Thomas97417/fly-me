import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserPlus, UserCheck, UserMinus } from "lucide-react";

interface FollowButtonProps {
  userId: string;
  className?: string;
}

export default function FollowButton({ userId, className }: FollowButtonProps) {
  const state = useQuery(api.subscriptions.getSubscriptionState, { userId });
  const subscribe = useMutation(api.subscriptions.subscribe).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.subscriptions.getSubscriptionState, {
        userId: args.userId,
      });
      if (current && !current.isSelf && !current.isSubscribed) {
        localStore.setQuery(
          api.subscriptions.getSubscriptionState,
          { userId: args.userId },
          { isSubscribed: true, isSelf: false },
        );
      }

      const stats = localStore.getQuery(api.subscriptions.getSubscriptionStats, {
        userId: args.userId,
      });
      if (stats) {
        localStore.setQuery(
          api.subscriptions.getSubscriptionStats,
          { userId: args.userId },
          { ...stats, followersCount: stats.followersCount + 1 },
        );
      }
    },
  );
  const unsubscribe = useMutation(api.subscriptions.unsubscribe).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.subscriptions.getSubscriptionState, {
        userId: args.userId,
      });
      if (current && !current.isSelf && current.isSubscribed) {
        localStore.setQuery(
          api.subscriptions.getSubscriptionState,
          { userId: args.userId },
          { isSubscribed: false, isSelf: false },
        );
      }

      const stats = localStore.getQuery(api.subscriptions.getSubscriptionStats, {
        userId: args.userId,
      });
      if (stats) {
        localStore.setQuery(
          api.subscriptions.getSubscriptionStats,
          { userId: args.userId },
          {
            ...stats,
            followersCount: Math.max(0, stats.followersCount - 1),
          },
        );
      }
    },
  );
  const [pending, setPending] = useState(false);
  const [hovered, setHovered] = useState(false);

  if (!state || state.isSelf) return null;

  const handleClick = async () => {
    setPending(true);
    try {
      if (state.isSubscribed) {
        await unsubscribe({ userId });
        toast.success("Désabonné");
      } else {
        await subscribe({ userId });
        toast.success("Abonné");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Une erreur est survenue",
      );
    } finally {
      setPending(false);
    }
  };

  const sharedClasses =
    "min-w-[10rem] justify-center gap-1.5 rounded-full transition-colors cursor-pointer";

  if (state.isSubscribed) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleClick}
        className={cn(
          sharedClasses,
          "border-border/70 bg-background",
          "hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive",
          className,
        )}
      >
        {hovered ? (
          <>
            <UserMinus className="size-4" />
            Ne plus suivre
          </>
        ) : (
          <>
            <UserCheck className="size-4" />
            Abonné
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={handleClick}
      className={cn(sharedClasses, "shadow-sm", className)}
    >
      <UserPlus className="size-4" />
      Suivre
    </Button>
  );
}
