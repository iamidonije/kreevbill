import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import { CalendarClock, Lightbulb, MessageCircle, Plus, Sparkle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useItems, useProfile, useSavingsActions } from "@/lib/data";
import { convert, daysUntil, formatMoney, itemMonthly, label, needsCardFunding, totalMonthly } from "@/lib/billing";
import { ItemRow } from "@/components/billwise/ItemRow";
import { ItemForm } from "@/components/billwise/ItemForm";
import { EmptyState } from "@/components/billwise/EmptyState";
import { DemoToggle } from "@/components/billwise/AppShell";

export const Route = createFileRoute("/_authenticated/overview")({
  head: () => ({ meta: [{ title: "Overview — Billwise" }, { name: "description", content: "Your monthly commitments at a glance." }] }),
  component: Overview,
});

const CHART = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];

function Overview() {
  const { data: profile } = useProfile();
  const { data: items, isLoading } = useItems();
  const { data: actions = [] } = useSavingsActions();
  const [adding, setAdding] = useState(false);
  const cur = profile?.currency ?? "NGN";
  const fx = profile?.fx_rates ?? {};
  const active = useMemo(() => (items ?? []).filter((i) => i.status === "active"), [items]);

  const monthly = totalMonthly(active, cur, fx);
  const subs = active.filter((i) => i.type === "subscription").length;
  const soon = active.filter((i) => { const d = daysUntil(i.next_due_date); return d !== null && d <= 7; });
  const confirmed = actions.filter((a) => a.confirmed).reduce((s, a) => s + a.estimated_monthly_saving, 0);
  const estimated = actions.filter((a) => !a.confirmed).reduce((s, a) => s + a.estimated_monthly_saving, 0);

  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    active.forEach((i) => m.set(i.category, (m.get(i.category) ?? 0) + itemMonthly(i, cur, fx)));
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [active, cur, fx]);

  const tips = useMemo(() => {
    const t: string[] = [];
    const streaming = active.filter((i) => i.category === "streaming");
    if (streaming.length >= 3) t.push(`You have ${streaming.length} streaming services. Consider rotating them month to month — check which ones you actually watched.`);
    const unreviewed = active.filter((i) => !i.last_reviewed_at);
    if (unreviewed.length) t.push(`${unreviewed.length} item${unreviewed.length > 1 ? "s haven't" : " hasn't"} been reviewed yet. Take a minute to confirm you still use ${unreviewed.length > 1 ? "them" : "it"}.`);
    const usd = active.filter((i) => i.is_usd_billed);
    if (usd.length) t.push(`${usd.length} subscription${usd.length > 1 ? "s are" : " is"} billed in dollars. Check if a naira plan is available — it may be cheaper and avoids card limits.`);
    const monthlyYearly = active.find((i) => i.billing_cycle === "monthly" && i.type === "subscription" && i.amount > 2000);
    if (monthlyYearly) t.push(`${monthlyYearly.name} may offer a yearly plan. Paying yearly often saves 15–20% — worth checking.`);
    return t.slice(0, 3);
  }, [active]);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-40 rounded-3xl" /><Skeleton className="h-24 rounded-3xl" /><Skeleton className="h-64 rounded-3xl" /></div>;

  const first = profile?.full_name?.split(" ")[0];

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hello{first ? `, ${first}` : ""} 👋</p>
          <h1 className="font-display text-2xl font-bold lg:text-3xl">Here's your month</h1>
        </div>
        <Button onClick={() => setAdding(true)} className="rounded-full" size="sm"><Plus className="h-4 w-4" />Add</Button>
      </header>

      {!items?.length ? (
        <EmptyState icon={<CalendarClock className="h-6 w-6" />} title="Nothing tracked yet"
          body="Add your first bill or subscription — or load some demo data to see how Billwise works."
          action={<><Button className="rounded-full" onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add a bill</Button><div className="rounded-full border border-border bg-card px-3 py-1"><DemoToggle compact /></div></>} />
      ) : (
        <>
          <section className="rounded-3xl bg-hero p-6 text-primary-foreground shadow-float">
            <p className="text-sm opacity-80">Total monthly commitments</p>
            <p className="num font-display mt-1 text-4xl font-bold">{formatMoney(monthly, cur)}</p>
            <p className="mt-1 text-sm opacity-80">{formatMoney(monthly * 12, cur)} a year</p>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Active subscriptions" value={String(subs)} />
            <Stat label="Due in next 7 days" value={String(soon.length)} tone={soon.length ? "warn" : undefined} />
            <Stat label="Confirmed savings" value={formatMoney(confirmed, cur)} sub="/month · you acted" tone="good" />
            <Stat label="Estimated opportunities" value={formatMoney(estimated, cur)} sub="/month · to verify" />
          </section>

          <div className="grid gap-6 lg:grid-cols-5">
            <section className="rounded-3xl bg-card p-5 shadow-card lg:col-span-2">
              <h2 className="font-display font-bold">Spending by category</h2>
              <div className="relative mx-auto mt-2 h-48 w-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={byCat} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={2} stroke="none">
                      {byCat.map((_, i) => <Cell key={i} fill={CHART[i % CHART.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground">per month</span>
                  <span className="num font-display font-bold">{formatMoney(monthly, cur)}</span>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {byCat.map((c, i) => (
                  <li key={c.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART[i % CHART.length] }} />
                    <span className="flex-1">{label(c.name)}</span>
                    <span className="num font-medium">{formatMoney(c.value, cur)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-3 lg:col-span-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold">Coming up</h2>
                <Link to="/bills" className="text-sm font-medium text-primary">See all</Link>
              </div>
              {active.filter((i) => i.next_due_date).slice(0, 5).map((i) => <ItemRow key={i.id} item={i} currency={cur} fx={fx} />)}
              {active.some((i) => needsCardFunding(i)) && (
                <p className="rounded-2xl bg-warning-soft p-3 text-sm text-warning">
                  A dollar-billed subscription renews within 3 days. Make sure your card is funded
                  {` (about ${formatMoney(active.filter((i) => needsCardFunding(i)).reduce((s, i) => s + convert(i.amount, i.currency, cur, fx), 0), cur)})`}.
                </p>
              )}
            </section>
          </div>

          {tips.length > 0 && (
            <section className="rounded-3xl bg-card p-5 shadow-card">
              <h2 className="font-display flex items-center gap-2 font-bold"><Lightbulb className="h-5 w-5 text-primary" />Suggestions to check</h2>
              <p className="text-xs text-muted-foreground">Ideas based on what you've added — please verify before acting.</p>
              <ol className="mt-4 space-y-3">
                {tips.map((t, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{i + 1}</span>{t}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}

      <button onClick={() => toast("Ask Billwise is coming soon", { description: "Your AI savings assistant arrives in the next update." })}
        className="fixed bottom-24 right-5 z-30 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-float lg:bottom-8 lg:right-8">
        <MessageCircle className="h-5 w-5" />Ask Billwise<Sparkle className="h-3.5 w-3.5 opacity-70" />
      </button>

      <ItemForm open={adding} onOpenChange={setAdding} />
    </div>
  );
}

function Stat({ label: l, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "warn" | "good" }) {
  const c = tone === "warn" ? "text-warning" : tone === "good" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-3xl bg-card p-4 shadow-card">
      <p className="text-xs text-muted-foreground">{l}</p>
      <p className={`num font-display mt-1 text-xl font-bold ${c}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
