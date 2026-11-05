import { Link } from "@tanstack/react-router";
import { CalendarClock, LayoutGrid, Repeat, LogOut, Database, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./Logo";
import { clearDemo, seedDemo, useItems } from "@/lib/data";
import { Switch } from "@/components/ui/switch";

const NAV = [
  { to: "/overview", label: "Overview", icon: LayoutGrid },
  { to: "/subscriptions", label: "Subscriptions", icon: Repeat },
  { to: "/bills", label: "Bills", icon: CalendarClock },
  { to: "/advisor", label: "Advisor", icon: Sparkles },
] as const;

export function DemoToggle({ compact = false }: { compact?: boolean }) {
  const { data: items = [] } = useItems();
  const qc = useQueryClient();
  const on = items.some((i) => i.is_demo);
  async function toggle(v: boolean) {
    try {
      if (v) await seedDemo();
      else await clearDemo();
      await qc.invalidateQueries();
      toast.success(v ? "Demo data added" : "Demo data removed");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return (
    <label className={`flex items-center gap-2 text-sm ${compact ? "" : "justify-between rounded-xl px-3 py-2"} text-muted-foreground`}>
      <span className="flex items-center gap-2"><Database className="h-4 w-4" />Demo data</span>
      <Switch checked={on} onCheckedChange={toggle} aria-label="Toggle demo data" />
    </label>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-5 lg:flex">
        <Logo />
        <nav className="mt-10 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent !text-sidebar-accent-foreground" }}>
              <Icon className="h-5 w-5" />{label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          <DemoToggle />
          <button onClick={() => supabase.auth.signOut()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4" />Sign out
          </button>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-28 pt-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-1 py-3 text-[11px] font-medium text-muted-foreground"
              activeProps={{ className: "!text-primary" }}>
              <Icon className="h-5 w-5" />{label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
