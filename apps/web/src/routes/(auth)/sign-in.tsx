import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Drone } from "lucide-react";
import SignInForm from "@/components/auth/sign-in-form";
import AuthSidePattern from "@/components/auth/auth-side-pattern";

export const Route = createFileRoute("/(auth)/sign-in")({
  head: () => ({
    meta: [
      { title: "Connexion — FlyMe" },
      {
        name: "description",
        content: "Connecte-toi à ton compte FlyMe.",
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if (context.isAuthenticated) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left — form */}
      <div className="relative flex min-h-svh flex-col">
        <div className="px-8 pt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight hover:text-primary transition-colors"
          >
            <Drone className="size-4" />
            FlyMe
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-12">
          <SignInForm />
        </div>
      </div>

      {/* Right — decorative panel (desktop only) */}
      <div className="relative hidden lg:block">
        <AuthSidePattern />
      </div>
    </div>
  );
}
