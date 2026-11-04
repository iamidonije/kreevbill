import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarClock, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useItems, useProfile, useSaveItem } from "@/lib/data";
import { convert, dueState, formatMoney, nextDueAfterPayment, type BillItem } from "@/lib/billing";
import { ItemRow } from "@/components/billwise/ItemRow";
import { ItemForm } from "@/components/billwise/ItemForm";
import { EmptyState } from "@/components/billwise/EmptyState";
import { DemoToggle } from "@/components/billwise/AppShell";

export const Route = createFileRoute("/_authenticated/bills")({
  head: () => ({ meta: [{ title: "Bills & payments — Billwise" }, { name: "description", content: "Upcoming and overdue payments, in date order." }] }),
  component: Bills,
});

const GROUPS = [
  { key: "overdue", title: "Overdue", tone: "text-destructive" },
  { key: "due_soon", title: "Due this week", tone: "text-warning" },
  { key: "upcoming", title: "Later", tone: "text-foreground" },
  { key: "none", title: "No date set", tone: "text-muted-foreground" },
] as const;

function Bills() {
  const { data: profile } = useProfile();
  const { data: items, isLoading } = useItems();
  const save = useSaveItem();
  const [adding, setAdding] = useState(false);
  const cur = profile?.currency ?? "NGN";
  const fx = profile?.fx_rates ?? {};
  const active = useMemo(() => (items ?? []).filter((i) => i.status === "active"), [items]);

  async function markPaid(i: BillItem) {
    const next = nextDueAfterPayment(i);
    try {
      await save.mutateAsync({ id: i.id, values: { next_due_date: next, last_paid_at: new Date().toISOString(), ...(i.billing_cycle === "one_time" && !i.is_variable ? { status: "cancelled" } : {}) } });
      toast.success(`${i.name} paid`, { description: next ? `Next due ${format(parseISO(next), "d MMM yyyy")}` : "All done" });
    } catch (e) { toast.error((e as Error).message); }
  }

  const overdueTotal = active.filter((i) => dueState(i.next_due_date) === "overdue").reduce((s, i) => s + convert(i.amount, i.currency, cur, fx), 0);
  const weekTotal = active.filter((i) => dueState(i.next_due_date) === "due_soon").reduce((s, i) => s + convert(i.amount, i.currency, cur, fx), 0);

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold lg:text-3xl">Bills & payments</h1>
          <p className="text-sm text-muted-foreground">Reminders are free, always.</p>
        </div>
        <Button onClick={() => setAdding(true)} className="rounded-full" size="sm"><Plus className="h-4 w-4" />Add</Button>
      </header>

      {isLoading ? <Skeleton className="h-64 rounded-3xl" /> : !active.length ? (
        <EmptyState icon={<CalendarClock className="h-6 w-6" />} title="No bills to pay"
          body="Add rent, electricity, data, school fees — anything you pay regularly — and we'll keep them in date order."
          action={<><Button className="rounded-full" onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add a bill</Button><div className="rounded-full border border-border bg-card px-3 py-1"><DemoToggle compact /></div></>} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-card p-4 shadow-card"><p className="text-xs text-muted-foreground">Overdue</p><p className="num font-display text-xl font-bold text-destructive">{formatMoney(overdueTotal, cur)}</p></div>
            <div className="rounded-3xl bg-card p-4 shadow-card"><p className="text-xs text-muted-foreground">Due in 7 days</p><p className="num font-display text-xl font-bold text-warning">{formatMoney(weekTotal, cur)}</p></div>
          </div>
          {GROUPS.map((g) => {
            const list = active.filter((i) => dueState(i.next_due_date) === g.key);
            if (!list.length) return null;
            return (
              <section key={g.key} className="space-y-2">
                <h2 className={`font-display text-sm font-bold uppercase tracking-wide ${g.tone}`}>{g.title} · {list.length}</h2>
                {list.map((i) => (
                  <div key={i.id}>
                    {i.next_due_date && g.key !== "none" && <p className="mb-1 ml-1 text-[11px] text-muted-foreground">{format(parseISO(i.next_due_date), "EEE d MMM")}</p>}
                    <ItemRow item={i} currency={cur} fx={fx} right={
                      <Button size="icon" variant="outline" className="h-10 w-10 shrink-0 rounded-full" onClick={() => markPaid(i)} aria-label={`Mark ${i.name} as paid`}>
                        <Check className="h-4 w-4" />
                      </Button>
                    } />
                  </div>
                ))}
              </section>
            );
          })}
        </>
      )}
      <ItemForm open={adding} onOpenChange={setAdding} />
    </div>
  );
}
