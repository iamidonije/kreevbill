import { createFileRoute, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/billwise/AppShell";
import { useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { data: profile } = useProfile();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onOnboarding = pathname.startsWith("/onboarding");

  useEffect(() => {
    if (profile && !profile.onboarded && !onOnboarding) navigate({ to: "/onboarding" });
  }, [profile, onOnboarding, navigate]);

  if (onOnboarding) return <Outlet />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
