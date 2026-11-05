import type { BillItem } from "./billing";

const COLS: (keyof BillItem)[] = [
  "name", "type", "category", "amount", "currency", "billing_cycle", "next_due_date",
  "status", "is_variable", "is_usd_billed", "last_paid_at", "payment_method_note", "notes",
];

export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function itemsToCsv(items: BillItem[]): string {
  const rows = [COLS.join(","), ...items.map((i) => COLS.map((c) => csvCell(i[c])).join(","))];
  return "\uFEFF" + rows.join("\r\n");
}

export function downloadCsv(items: BillItem[], filename: string) {
  const blob = new Blob([itemsToCsv(items)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
