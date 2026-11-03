import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bell, PiggyBank, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/billwise/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Billwise — Know what you're paying for" },
      { name: "description", content: "Track subscriptions and recurring bills in naira, get free reminders, and find ways to save." },
      { property: "og:title", content: "Billwise — Know what you're paying for" },
      { property: "og:description", content: "Track subscriptions and bills, never miss a payment, and save money." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/overview" });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-8">
        <Logo />
        <div className="mt-10 rounded-3xl bg-hero p-7 text-primary-foreground shadow-float">
          <p className="text-sm opacity-80">This month</p>
          <p className="num font-display mt-1 text-4xl font-bold">₦58,470</p>
          <p className="mt-1 text-sm opacity-80">across 9 bills · 3 due this week</p>
          <div className="mt-6 space-y-2">
            {[["DSTV Compact", "Tomorrow", "₦15,700"], ["Netflix", "In 2 days", "₦5,000"], ["iCloud", "Fund your card", "$2.99"]].map(([n, w, a]) => (
              <div key={n} className="flex items-center justify-between rounded-2xl bg-primary-foreground/10 px-4 py-3 text-sm">
                <div><p className="font-semibold">{n}</p><p className="text-xs opacity-75">{w}</p></div>
                <span className="num font-semibold">{a}</span>
              </div>
            ))}
          </div>
        </div>
        <h1 className="font-display mt-10 text-4xl font-bold leading-[1.05] text-foreground">
          Know what you're paying for. Never miss a bill.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Subscriptions, DSTV, data, rent, school fees — all in one place, with free reminders before every payment.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
          <Feature icon={<Bell className="h-4 w-4" />} text="Free reminders" />
          <Feature icon={<Wallet className="h-4 w-4" />} text="Naira totals" />
          <Feature icon={<PiggyBank className="h-4 w-4" />} text="Save money" />
        </div>
        <div className="mt-auto pt-10">
          <Link to="/auth" className="flex h-14 w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-float">
            Get started — it's free
          </Link>
          <Link to="/auth" search={{ mode: "signin" }} className="mt-3 block text-center text-sm font-medium text-muted-foreground">
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-3 text-center shadow-card">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary">{icon}</span>
      {text}
    </div>
  );
}
