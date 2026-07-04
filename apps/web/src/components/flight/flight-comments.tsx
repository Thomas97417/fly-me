import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import type {
  Doc,
  Id,
} from "@my-better-t-app/backend/convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { User, Trash2, Reply, Send, Heart } from "lucide-react";

interface FlightCommentsProps {
  flightId: Id<"flights">;
  flightOwnerId: string;
}

type Author = { _id: string; name: string | null; image: string | null } | null;
type CommentWithLikes = Doc<"comments"> & {
  likeCount: number;
  isLikedByMe: boolean;
};
type Thread = {
  comment: CommentWithLikes;
  author: Author;
  replies: Array<{ comment: CommentWithLikes; author: Author }>;
};

function applyLike(
  threads: Thread[],
  commentId: Id<"comments">,
  isLikedTarget: boolean,
): Thread[] {
  const patch = (c: CommentWithLikes): CommentWithLikes => {
    if (c._id !== commentId) return c;
    if (c.isLikedByMe === isLikedTarget) return c;
    return {
      ...c,
      likeCount: isLikedTarget
        ? c.likeCount + 1
        : Math.max(0, c.likeCount - 1),
      isLikedByMe: isLikedTarget,
    };
  };

  return threads.map((thread) => ({
    ...thread,
    comment: patch(thread.comment),
    replies: thread.replies.map((r) => ({ ...r, comment: patch(r.comment) })),
  }));
}

export default function FlightComments({
  flightId,
  flightOwnerId,
}: FlightCommentsProps) {
  const threads = useQuery(api.comments.listFlightComments, { flightId });
  const user = useCurrentUser();
  const navigate = useNavigate();
  const addComment = useMutation(api.comments.addComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const likeComment = useMutation(
    api.comments.likeComment,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.comments.listFlightComments, {
      flightId: args.flightId,
    });
    if (!current) return;
    localStore.setQuery(
      api.comments.listFlightComments,
      { flightId: args.flightId },
      applyLike(current, args.commentId, true),
    );
  });
  const unlikeComment = useMutation(
    api.comments.unlikeComment,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.comments.listFlightComments, {
      flightId: args.flightId,
    });
    if (!current) return;
    localStore.setQuery(
      api.comments.listFlightComments,
      { flightId: args.flightId },
      applyLike(current, args.commentId, false),
    );
  });

  const [rootDraft, setRootDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<Id<"comments"> | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (
    content: string,
    parentCommentId?: Id<"comments">,
  ) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setPending(true);
    try {
      await addComment({ flightId, content: trimmed, parentCommentId });
      if (parentCommentId) {
        setReplyDraft("");
        setReplyingTo(null);
      } else {
        setRootDraft("");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la publication.",
      );
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async (commentId: Id<"comments">) => {
    try {
      await deleteComment({ commentId });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la suppression.",
      );
    }
  };

  const handleToggleLike = async (comment: CommentWithLikes) => {
    if (!user) {
      navigate({ to: "/sign-in" });
      return;
    }
    try {
      if (comment.isLikedByMe) {
        await unlikeComment({ commentId: comment._id, flightId });
      } else {
        await likeComment({ commentId: comment._id, flightId });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Une erreur est survenue.",
      );
    }
  };

  const canModerate = (authorId: string) =>
    !!user && (user._id === authorId || user._id === flightOwnerId);

  return (
    <div className="flex flex-col gap-6">
      {user ? (
        <Composer
          value={rootDraft}
          onChange={setRootDraft}
          onSubmit={() => handleSubmit(rootDraft)}
          pending={pending}
          placeholder="Laisse un commentaire…"
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link to="/sign-in" className="font-medium underline hover:text-foreground">
            Connecte-toi
          </Link>{" "}
          pour commenter ce vol.
        </p>
      )}

      {threads === undefined ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : threads.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Soyez le premier à commenter ce vol.
        </p>
      ) : (
        <ul className="flex flex-col gap-6">
          {threads.map((thread) => (
            <li key={thread.comment._id} className="flex flex-col gap-3">
              <CommentBubble
                comment={thread.comment}
                author={thread.author}
                canDelete={canModerate(thread.comment.userId)}
                onDelete={() => handleDelete(thread.comment._id)}
                onToggleLike={() => handleToggleLike(thread.comment)}
                onReplyClick={
                  user
                    ? () => {
                        setReplyingTo(thread.comment._id);
                        setReplyDraft("");
                      }
                    : undefined
                }
              />

              {(thread.replies.length > 0 ||
                replyingTo === thread.comment._id) && (
                <div className="ml-10 flex flex-col gap-4 border-l border-border/50 pl-4">
                  {thread.replies.map((r) => (
                    <CommentBubble
                      key={r.comment._id}
                      comment={r.comment}
                      author={r.author}
                      canDelete={canModerate(r.comment.userId)}
                      onDelete={() => handleDelete(r.comment._id)}
                      onToggleLike={() => handleToggleLike(r.comment)}
                      isReply
                    />
                  ))}

                  {replyingTo === thread.comment._id && user && (
                    <div className="flex flex-col gap-2">
                      <Composer
                        value={replyDraft}
                        onChange={setReplyDraft}
                        onSubmit={() =>
                          handleSubmit(replyDraft, thread.comment._id)
                        }
                        pending={pending}
                        placeholder={`Réponse à ${thread.author?.name ?? "ce pilote"}…`}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyDraft("");
                        }}
                        className="self-start text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  pending,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  pending: boolean;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={3}
        className="w-full resize-none rounded-xl border border-border/50 bg-background/70 px-3 py-2 text-sm leading-relaxed shadow-sm outline-none transition-colors focus:border-primary/40"
      />
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={onSubmit}
          disabled={pending || value.trim().length === 0}
          className="gap-1.5"
        >
          <Send className="size-3.5" />
          Publier
        </Button>
      </div>
    </div>
  );
}

function CommentBubble({
  comment,
  author,
  canDelete,
  onDelete,
  onReplyClick,
  onToggleLike,
  isReply,
}: {
  comment: CommentWithLikes;
  author: Author;
  canDelete: boolean;
  onDelete: () => void;
  onReplyClick?: () => void;
  onToggleLike: () => void;
  isReply?: boolean;
}) {
  const name = author?.name ?? "Pilote";
  const userId = author?._id ?? comment.userId;

  return (
    <article className="flex gap-3">
      <Link
        to="/users/$userId"
        params={{ userId }}
        className="shrink-0"
        aria-label={`Voir le profil de ${name}`}
      >
        <div
          className={cn(
            "overflow-hidden rounded-full bg-muted ring-1 ring-border/50 flex items-center justify-center",
            isReply ? "size-7" : "size-9",
          )}
        >
          {author?.image ? (
            <img
              src={author.image}
              alt={name}
              className="size-full object-cover"
            />
          ) : (
            <User
              className={cn(
                "text-muted-foreground",
                isReply ? "size-3.5" : "size-4",
              )}
            />
          )}
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <Link
            to="/users/$userId"
            params={{ userId }}
            className="text-sm font-semibold tracking-tight hover:text-primary transition-colors truncate"
          >
            {name}
          </Link>
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(comment._creationTime), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
          {comment.content}
        </p>

        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={onToggleLike}
            aria-label={comment.isLikedByMe ? "Retirer le like" : "Liker"}
            className={cn(
              "inline-flex items-center gap-1 transition-colors",
              comment.isLikedByMe
                ? "text-rose-500"
                : "hover:text-rose-500",
            )}
          >
            <Heart
              className={cn("size-3", comment.isLikedByMe && "fill-current")}
            />
            {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
          </button>
          {onReplyClick && (
            <button
              type="button"
              onClick={onReplyClick}
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Reply className="size-3" />
              Répondre
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1 hover:text-destructive transition-colors"
            >
              <Trash2 className="size-3" />
              Supprimer
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
