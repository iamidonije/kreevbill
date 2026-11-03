import { addDays, addMonths, addWeeks, addYears, differenceInCalendarDays, format, parseISO } from "date-fns";

export const CURRENCIES = ["NGN", "GHS", "KES", "ZAR", "GBP", "USD", "CAD"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const CURRENCY_SYMBOL: Record<string, string> = {
  NGN: "₦", GHS: "GH₵", KES: "KSh", ZAR: "R", GBP: "£", USD: "$", CAD: "C$",
};
/** Rates are "units of NGN per 1 unit of currency". */
export const DEFAULT_FX: Record<string, number> = {
  NGN: 1, USD: 1550, GBP: 1950, CAD: 1130, GHS: 105, KES: 12, ZAR: 85,
};

export const FREE_ITEM_LIMIT = 8;

export type Cycle = "weekly" | "monthly" | "quarterly" | "yearly" | "one_time";

export interface BillItem {
  id: string;
  name: string;
  type: string;
  category: string;
  amount: number;
  currency: string;
  billing_cycle: Cycle | string;
  next_due_date: string | null;
  is_variable: boolean;
  topup_every_days: number | null;
  status: string;
  is_usd_billed: boolean;
  payment_method_note: string | null;
  notes: string | null;
  is_demo: boolean;
  last_reviewed_at: string | null;
  last_paid_at: string | null;
  created_at: string;
}

export function formatMoney(amount: number, currency = "NGN", opts: { decimals?: boolean } = {}) {
  const sym = CURRENCY_SYMBOL[currency] ?? currency + " ";
  const n = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : 0,
  }).format(Math.round(amount * (opts.decimals ? 100 : 1)) / (opts.decimals ? 100 : 1));
  return `${amount < 0 ? "-" : ""}${sym}${n.replace("-", "")}`;
}

export function convert(amount: number, from: string, to: string, fx: Record<string, number> = DEFAULT_FX) {
  if (from === to) return amount;
  const f = fx[from] ?? DEFAULT_FX[from] ?? 1;
  const t = fx[to] ?? DEFAULT_FX[to] ?? 1;
  return (amount * f) / t;
}

/** Monthly equivalent of a recurring charge. One-time payments don't count. */
export function monthlyEquivalent(amount: number, cycle: string) {
  switch (cycle) {
    case "weekly": return (amount * 52) / 12;
    case "monthly": return amount;
    case "quarterly": return amount / 3;
    case "yearly": return amount / 12;
    default: return 0;
  }
}

export function itemMonthly(item: Pick<BillItem, "amount" | "currency" | "billing_cycle" | "is_variable" | "topup_every_days">, to: string, fx?: Record<string, number>) {
  const base = item.is_variable && item.topup_every_days
    ? (Number(item.amount) * 30) / item.topup_every_days
    : monthlyEquivalent(Number(item.amount), item.billing_cycle);
  return convert(base, item.currency, to, fx);
}

export function totalMonthly(items: BillItem[], to: string, fx?: Record<string, number>) {
  return items.filter((i) => i.status === "active").reduce((s, i) => s + itemMonthly(i, to, fx), 0);
}

export type DueState = "overdue" | "due_soon" | "upcoming" | "none";

export function daysUntil(date: string | null, today = new Date()) {
  if (!date) return null;
  return differenceInCalendarDays(parseISO(date), today);
}

export function dueState(date: string | null, today = new Date()): DueState {
  const d = daysUntil(date, today);
  if (d === null) return "none";
  if (d < 0) return "overdue";
  if (d <= 7) return "due_soon";
  return "upcoming";
}

/** USD-billed items: flag "make sure your card is funded" from 3 days before renewal. */
export function needsCardFunding(item: Pick<BillItem, "is_usd_billed" | "next_due_date" | "status">, today = new Date()) {
  if (!item.is_usd_billed || item.status !== "active") return false;
  const d = daysUntil(item.next_due_date, today);
  return d !== null && d >= 0 && d <= 3;
}

/** Next due date after paying. Variable/prepaid items roll from the payment day. */
export function nextDueAfterPayment(
  item: Pick<BillItem, "billing_cycle" | "next_due_date" | "is_variable" | "topup_every_days">,
  today = new Date(),
): string | null {
  if (item.is_variable) {
    return item.topup_every_days ? format(addDays(today, item.topup_every_days), "yyyy-MM-dd") : null;
  }
  if (!item.next_due_date || item.billing_cycle === "one_time") return null;
  let d = parseISO(item.next_due_date);
  const step = (x: Date) => {
    switch (item.billing_cycle) {
      case "weekly": return addWeeks(x, 1);
      case "quarterly": return addMonths(x, 3);
      case "yearly": return addYears(x, 1);
      default: return addMonths(x, 1);
    }
  };
  d = step(d);
  // If several cycles were missed, catch up so the next date is in the future.
  while (differenceInCalendarDays(d, today) < 0) d = step(d);
  return format(d, "yyyy-MM-dd");
}

export function canAddItem(plan: string, nonDemoCount: number) {
  return plan !== "free" || nonDemoCount < FREE_ITEM_LIMIT;
}

export const CATEGORIES = ["streaming", "utilities", "internet", "housing", "education", "insurance", "fitness", "cloud", "other"] as const;
export const TYPES = ["subscription", "bill", "rent", "school_fees", "insurance", "loan", "other"] as const;
export const CYCLES = ["weekly", "monthly", "quarterly", "yearly", "one_time"] as const;

export const label = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
export const CYCLE_LABEL: Record<string, string> = {
  weekly: "week", monthly: "month", quarterly: "quarter", yearly: "year", one_time: "one-time",
};
