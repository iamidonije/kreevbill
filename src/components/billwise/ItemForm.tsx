import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CURRENCIES, CYCLES, FREE_ITEM_LIMIT, TYPES, canAddItem, label, type BillItem } from "@/lib/billing";
import { useItems, useProfile, useSaveItem, type ItemInput } from "@/lib/data";

const blank: ItemInput = {
  name: "", type: "subscription", category: "streaming", amount: 0, currency: "NGN",
  billing_cycle: "monthly", next_due_date: null, is_variable: false, topup_every_days: null,
  status: "active", is_usd_billed: false, payment_method_note: "", notes: "",
};

export function ItemForm({ open, onOpenChange, item, defaults }: {
  open: boolean; onOpenChange: (o: boolean) => void; item?: BillItem; defaults?: ItemInput;
}) {
  const [v, setV] = useState<ItemInput>(blank);
  const save = useSaveItem();
  const { data: profile } = useProfile();
  const { data: items = [] } = useItems();

  useEffect(() => {
    if (open) setV(item ? { ...item } : { ...blank, currency: profile?.currency ?? "NGN", ...defaults });
  }, [open, item, defaults, profile?.currency]);

  const set = <K extends keyof ItemInput>(k: K, val: ItemInput[K]) => setV((p) => ({ ...p, [k]: val }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!item && !canAddItem(profile?.plan ?? "free", items.filter((i) => !i.is_demo).length)) {
      toast.error(`The free plan tracks up to ${FREE_ITEM_LIMIT} items. Upgrade to Premium for unlimited.`);
      return;
    }
    const { id: _id, created_at: _c, ...rest } = v as BillItem;
    const values: ItemInput = {
      ...rest,
      amount: Number(v.amount) || 0,
      next_due_date: v.next_due_date || null,
      topup_every_days: v.is_variable ? Number(v.topup_every_days) || null : null,
      is_usd_billed: v.currency === "USD" ? true : !!v.is_usd_billed,
    };
    try {
      await save.mutateAsync({ id: item?.id, values });
      toast.success(item ? "Saved" : `${v.name} added`);
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader><DialogTitle className="font-display text-xl">{item ? "Edit item" : "Add a bill or subscription"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name"><Input required value={v.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Netflix, DSTV, Rent" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount"><Input type="number" step="0.01" min="0" required value={v.amount ?? ""} onChange={(e) => set("amount", e.target.value as unknown as number)} /></Field>
            <Field label="Currency"><Pick value={v.currency!} onChange={(x) => set("currency", x)} options={CURRENCIES} raw /></Field>
            <Field label="Type"><Pick value={v.type!} onChange={(x) => set("type", x)} options={TYPES} /></Field>
            <Field label="Category"><Pick value={v.category!} onChange={(x) => set("category", x)} options={CATEGORIES} /></Field>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-muted p-3">
            <div><p className="text-sm font-medium">Prepaid / variable</p><p className="text-xs text-muted-foreground">Electricity tokens, data bundles — no fixed date</p></div>
            <Switch checked={!!v.is_variable} onCheckedChange={(x) => set("is_variable", x)} />
          </div>
          {v.is_variable ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Remind me to top up every (days)"><Input type="number" min="1" value={v.topup_every_days ?? ""} onChange={(e) => set("topup_every_days", e.target.value as unknown as number)} placeholder="14" /></Field>
              <Field label="Next top-up (optional)"><Input type="date" value={v.next_due_date ?? ""} onChange={(e) => set("next_due_date", e.target.value)} /></Field>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Billed every"><Pick value={v.billing_cycle!} onChange={(x) => set("billing_cycle", x)} options={CYCLES} /></Field>
              <Field label="Next due date"><Input type="date" value={v.next_due_date ?? ""} onChange={(e) => set("next_due_date", e.target.value)} /></Field>
            </div>
          )}
          {v.currency !== "USD" && (
            <label className="flex items-center justify-between text-sm"><span>Charged in dollars on my card</span>
              <Switch checked={!!v.is_usd_billed} onCheckedChange={(x) => set("is_usd_billed", x)} /></label>
          )}
          {item && (
            <Field label="Status"><Pick value={v.status!} onChange={(x) => set("status", x)} options={["active", "paused", "cancelled"]} /></Field>
          )}
          <Field label="How you pay (optional)"><Input value={v.payment_method_note ?? ""} onChange={(e) => set("payment_method_note", e.target.value)} placeholder="GTBank card ••42, bank transfer…" /></Field>
          <Field label="Notes (optional)"><Textarea rows={2} value={v.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></Field>
          <Button type="submit" disabled={save.isPending} className="h-12 w-full rounded-full text-base">{save.isPending ? "Saving…" : item ? "Save changes" : "Add item"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label: l, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{l}</Label>{children}</div>;
}

function Pick({ value, onChange, options, raw }: { value: string; onChange: (v: string) => void; options: readonly string[]; raw?: boolean }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{raw ? o : label(o)}</SelectItem>)}</SelectContent>
    </Select>
  );
}
