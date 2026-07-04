import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Settings as SettingsIcon,
  UserRound,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { useCurrentUser } from "@/hooks/use-current-user";

import ChangePasswordCard from "@/components/settings/change-password-card";
import DeleteAccountCard from "@/components/settings/delete-account-card";
import ProfileImageCard from "@/components/settings/profile-image-card";
import SessionsCard from "@/components/settings/sessions-card";
import EmailCard from "@/components/settings/update-email-card";
import UpdateNameCard from "@/components/settings/update-name-card";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres — FlyMe" },
      {
        name: "description",
        content: "Gère ton compte, ton email, ton mot de passe et tes sessions.",
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: RouteComponent,
});

function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-1 text-[11px] uppercase tracking-wider text-muted-foreground">
      <Icon className="size-3.5" />
      {label}
    </div>
  );
}

function RouteComponent() {
  const user = useCurrentUser();

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-4xl px-4 pt-24 pb-16">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-1.5">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <SettingsIcon className="size-3.5" />
          Compte
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Gère ton compte, ta sécurité et tes sessions actives.
        </p>
      </div>

      {/* Profile section */}
      <section className="flex flex-col gap-3">
        <SectionHeader icon={UserRound} label="Profil" />
        <div className="flex flex-col gap-4">
          <ProfileImageCard image={user.image ?? undefined} />
          <UpdateNameCard name={user.name} />
          <EmailCard email={user.email} />
        </div>
      </section>

      {/* Security section */}
      <section className="mt-10 flex flex-col gap-3">
        <SectionHeader icon={ShieldCheck} label="Sécurité" />
        <div className="flex flex-col gap-4">
          <ChangePasswordCard />
          <SessionsCard />
        </div>
      </section>

      {/* Danger zone */}
      <section className="mt-10 flex flex-col gap-3">
        <SectionHeader icon={TriangleAlert} label="Zone sensible" />
        <DeleteAccountCard />
      </section>
    </div>
  );
}
