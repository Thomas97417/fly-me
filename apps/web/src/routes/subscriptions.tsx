import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import PublicFlightCard from "@/components/public-flight-card";
import UserListItem from "@/components/user-list-item";
import { Users, UserPlus, Drone, User } from "lucide-react";

export const Route = createFileRoute("/subscriptions")({
  head: () => ({
    meta: [
      { title: "Mes abonnements — FlyMe" },
      {
        name: "description",
        content: "Tes abonnements, tes abonnés et les derniers vols de la communauté.",
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: SubscriptionsPage,
});

function OwnerStrip({
  owner,
}: {
  owner: { _id: string; name: string | null; image: string | null } | null;
}) {
  if (!owner) return null;
  return (
    <Link
      to="/users/$userId"
      params={{ userId: owner._id }}
      className="group/owner mb-2 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <div className="size-6 overflow-hidden rounded-full bg-muted ring-1 ring-border/50 flex items-center justify-center shrink-0">
        {owner.image ? (
          <img
            src={owner.image}
            alt={owner.name ?? ""}
            className="size-full object-cover"
          />
        ) : (
          <User className="size-3 text-muted-foreground" />
        )}
      </div>
      <span className="font-medium truncate">{owner.name ?? "Pilote"}</span>
    </Link>
  );
}

function SectionTitle({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
}) {
  return (
    <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="size-4" />
      {label}
      {count !== undefined && (
        <span className="text-foreground/80">({count})</span>
      )}
    </h2>
  );
}

function EmptyBlock({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-background/40 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted/60">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">{text}</p>
    </div>
  );
}

function FeedSection() {
  const feed = useQuery(api.subscriptions.listSubscriptionFeed);

  if (feed === undefined) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <EmptyBlock
        icon={Drone}
        text="Tu ne suis encore personne — abonne-toi à des pilotes pour voir leurs derniers vols ici."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {feed.map((flight) => (
        <div key={flight._id} className="flex flex-col">
          <OwnerStrip owner={flight.owner} />
          <PublicFlightCard flight={flight} />
        </div>
      ))}
    </div>
  );
}

function SubscriptionsList() {
  const subs = useQuery(api.subscriptions.listMySubscriptions);

  if (subs === undefined) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  if (subs.length === 0) {
    return (
      <EmptyBlock
        icon={UserPlus}
        text="Tu ne suis personne pour le moment."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {subs.map((u) => (
        <UserListItem key={u._id} user={u} />
      ))}
    </div>
  );
}

function FollowersList() {
  const followers = useQuery(api.subscriptions.listMyFollowers);

  if (followers === undefined) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  if (followers.length === 0) {
    return (
      <EmptyBlock icon={Users} text="Tu n'as pas encore d'abonné." />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {followers.map((u) => (
        <UserListItem key={u._id} user={u} />
      ))}
    </div>
  );
}

function SubscriptionsPage() {
  const subs = useQuery(api.subscriptions.listMySubscriptions);
  const followers = useQuery(api.subscriptions.listMyFollowers);

  return (
    <div className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-1.5">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Users className="size-3.5" />
          Communauté
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Mes abonnements</h1>
        <p className="text-sm text-muted-foreground">
          Suis les pilotes qui t'inspirent et garde un œil sur leurs derniers vols.
        </p>
      </div>

      <section className="mb-12">
        <SectionTitle icon={Drone} label="Derniers vols" />
        <FeedSection />
      </section>

      <div className="grid gap-8 sm:grid-cols-2">
        <section>
          <SectionTitle
            icon={UserPlus}
            label="Mes abonnements"
            count={subs?.length}
          />
          <SubscriptionsList />
        </section>

        <section>
          <SectionTitle
            icon={Users}
            label="Mes abonnés"
            count={followers?.length}
          />
          <FollowersList />
        </section>
      </div>
    </div>
  );
}
