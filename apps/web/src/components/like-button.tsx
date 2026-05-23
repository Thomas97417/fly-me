import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  flightId: string;
  className?: string;
}

export default function LikeButton({ flightId, className }: LikeButtonProps) {
  const id = flightId as Id<"flights">;
  const state = useQuery(api.likes.getLikeState, { flightId: id });
  const like = useMutation(api.likes.likeFlight);
  const unlike = useMutation(api.likes.unlikeFlight);
  const user = useCurrentUser();
  const navigate = useNavigate();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate({ to: "/sign-in" });
      return;
    }

    try {
      if (state?.isLiked) {
        await unlike({ flightId: id });
      } else {
        await like({ flightId: id });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Une erreur est survenue",
      );
    }
  };

  const isLiked = state?.isLiked ?? false;
  const count = state?.count ?? 0;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isLiked ? "Retirer le like" : "Liker ce vol"}
      className={cn(
        "inline-flex min-w-14 cursor-pointer items-center justify-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
        isLiked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500",
        className,
      )}
    >
      <Heart className={cn("size-3.5", isLiked && "fill-current")} />
      {count}
    </button>
  );
}
