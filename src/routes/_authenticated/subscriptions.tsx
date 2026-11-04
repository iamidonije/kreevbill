import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Repeat, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useItems, useProfile } from "@/lib/data";
import { CATEGORIES, formatMoney, label, totalMonthly } from "@/lib/billing";
import { ItemRow } from "@/components/billwise/ItemRow";
import { ItemForm } from "@/components/billwise/ItemForm";
import { EmptyState } from "@/components/billwise/EmptyState";
import { DemoToggle } from "@/components/billwise/AppShell";

export const Route = createFileRoute("/_authenticated/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions — Billwise" }, { name: "description", content: "All your subscriptions and recurring bills." }] }),
  component: Subscriptions,
});

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>
      {children}
    </button>
  );
}

function Subscriptions() {
  const { data: profile } = useProfile();
  const { data: items, isLoading } = useItems();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [status, setStatus] = useState<string>("active");
  const [adding, setAdding] = useState(false);
  const cur = profile?.currency ?? "NGN";
  const fx = profile?.fx_rates ?? {};

  const list = useMemo(() => (items ?? []).filter((i) =>
    (cat === "all" || i.category === cat) && (status === "all" || i.status === status) && i.name.toLowerCase().includes(q.toLowerCase()),
  ), [items, q, cat, status]);

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold lg:text-3xl">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">{list.length} shown · <span className="num">{formatMoney(totalMonthly(list, cur, fx), cur)}</span>/month</p>
        </div>
        <Button onClick={() => setAdding(true)} className="rounded-full" size="sm"><Plus className="h-4 w-4" />Add</Button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-11 rounded-full bg-card pl-10" />
      </div>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {["active", "paused", "cancelled", "all"].map((s) => <Chip key={s} on={status === s} onClick={() => setStatus(s)}>{label(s)}</Chip>)}
      </div>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        <Chip on={cat === "all"} onClick={() => setCat("all")}>All categories</Chip>
        {CATEGORIES.map((c) => <Chip key={c} on={cat === c} onClick={() => setCat(c)}>{label(c)}</Chip>)}
      </div>

      {isLoading ? <Skeleton className="h-64 rounded-3xl" /> : !items?.length ? (
        <EmptyState icon={<Repeat className="h-6 w-6" />} title="No subscriptions yet" body="Netflix, Spotify, DSTV, iCloud… add them here so you always know what's renewing."
          action={<><Button className="rounded-full" onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add subscription</Button><div className="rounded-full border border-border bg-card px-3 py-1"><DemoToggle compact /></div></>} />
      ) : list.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Nothing matches those filters.</p>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">{list.map((i) => <ItemRow key={i.id} item={i} currency={cur} fx={fx} />)}</div>
      )}
      <ItemForm open={adding} onOpenChange={setAdding} />
    </div>
  );
}
