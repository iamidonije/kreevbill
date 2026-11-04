import { Link } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { ItemAvatar } from "./ItemAvatar";
import { CYCLE_LABEL, convert, daysUntil, dueState, formatMoney, needsCardFunding, type BillItem } from "@/lib/billing";

export function dueText(item: BillItem) {
  const d = daysUntil(item.next_due_date);
  if (d === null) return item.is_variable ? `Top up every ${item.topup_every_days ?? "?"} days` : "No date set";
  if (d < -1) return `${-d} days overdue`;
  if (d === -1) return "Due yesterday";
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  return `Due in ${d} days`;
}

export function DueBadge({ item }: { item: BillItem }) {
  const s = dueState(item.next_due_date);
  const cls = s === "overdue" ? "bg-destructive/10 text-destructive" : s === "due_soon" ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{dueText(item)}</span>;
}

export function ItemRow({ item, currency, fx, right }: { item: BillItem; currency: string; fx: Record<string, number>; right?: React.ReactNode }) {
  const foreign = item.currency !== currency;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
      <Link to="/subscriptions/$id" params={{ id: item.id }} className="flex min-w-0 flex-1 items-center gap-3">
        <ItemAvatar name={item.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{item.name}{item.status !== "active" && <span className="ml-2 text-xs font-normal text-muted-foreground">({item.status})</span>}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <DueBadge item={item} />
            {needsCardFunding(item) && (
              <span className="flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning"><CreditCard className="h-3 w-3" />Fund your card</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="num font-semibold">{formatMoney(item.amount, item.currency, { decimals: item.currency === "USD" })}</p>
          <p className="num text-[11px] text-muted-foreground">
            {foreign ? `≈ ${formatMoney(convert(item.amount, item.currency, currency, fx), currency)}` : `/${CYCLE_LABEL[item.billing_cycle] ?? ""}`}
          </p>
        </div>
      </Link>
      {right}
    </div>
  );
}
