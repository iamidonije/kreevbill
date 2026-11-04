import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowLeft, CheckCircle2, CreditCard, Pause, Pencil, Play, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useDeleteItem, useItems, usePriceHistory, useProfile, useSaveItem } from "@/lib/data";
import { CYCLE_LABEL, convert, formatMoney, itemMonthly, label, needsCardFunding } from "@/lib/billing";
import { ItemAvatar } from "@/components/billwise/ItemAvatar";
import { DueBadge } from "@/components/billwise/ItemRow";
import { ItemForm } from "@/components/billwise/ItemForm";
import { cancelGuide } from "@/lib/cancel-guides";

export const Route = createFileRoute("/_authenticated/subscriptions_/$id")({
  head: () => ({ meta: [{ title: "Subscription details — Billwise" }, { name: "description", content: "Details, price history and how to cancel." }] }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { data: items, isLoading } = useItems();
  const { data: profile } = useProfile();
  const { data: history = [] } = usePriceHistory(id);
  const save = useSaveItem();
  const del = useDeleteItem();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const item = items?.find((i) => i.id === id);
  const cur = profile?.currency ?? "NGN";
  const fx = profile?.fx_rates ?? {};

  if (isLoading) return <Skeleton className="h-96 rounded-3xl" />;
  if (!item) return <div className="py-20 text-center"><p className="text-muted-foreground">This item doesn't exist anymore.</p><Link to="/subscriptions" className="mt-4 inline-block font-medium text-primary">Back to subscriptions</Link></div>;

  const patch = async (values: Record<string, unknown>, msg: string) => {
    try { await save.mutateAsync({ id, values }); toast.success(msg); } catch (e) { toast.error((e as Error).message); }
  };
  const guide = cancelGuide(item.name);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link to="/subscriptions" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Subscriptions</Link>

      <section className="rounded-3xl bg-card p-6 shadow-card">
        <div className="flex items-start gap-4">
          <ItemAvatar name={item.name} size={56} />
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">{item.name}</h1>
            <p className="text-sm text-muted-foreground">{label(item.category)} · {label(item.type)} · {label(item.status)}</p>
            <div className="mt-2 flex flex-wrap gap-1.5"><DueBadge item={item} />
              {needsCardFunding(item) && <span className="flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning"><CreditCard className="h-3 w-3" />Make sure your card is funded</span>}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted p-4">
            <p className="text-xs text-muted-foreground">{item.is_variable ? `Every ${item.topup_every_days ?? "?"} days` : `Per ${CYCLE_LABEL[item.billing_cycle]}`}</p>
            <p className="num font-display text-xl font-bold">{formatMoney(item.amount, item.currency, { decimals: item.currency === "USD" })}</p>
            {item.currency !== cur && <p className="num text-xs text-muted-foreground">≈ {formatMoney(convert(item.amount, item.currency, cur, fx), cur)}</p>}
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <p className="text-xs text-muted-foreground">Per month</p>
            <p className="num font-display text-xl font-bold">{formatMoney(itemMonthly(item, cur, fx), cur)}</p>
            <p className="text-xs text-muted-foreground">{item.next_due_date ? `Next: ${format(parseISO(item.next_due_date), "d MMM yyyy")}` : "No date"}</p>
          </div>
        </div>
        {(item.payment_method_note || item.notes) && (
          <div className="mt-4 space-y-1 text-sm">
            {item.payment_method_note && <p><span className="text-muted-foreground">Paid with:</span> {item.payment_method_note}</p>}
            {item.notes && <p className="text-muted-foreground">{item.notes}</p>}
          </div>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button variant="outline" className="rounded-full" onClick={() => patch({ last_reviewed_at: new Date().toISOString() }, "Marked as reviewed")}>
            <CheckCircle2 className="h-4 w-4" />Reviewed
          </Button>
          {item.status === "active" ? (
            <Button variant="outline" className="rounded-full" onClick={() => patch({ status: "paused" }, "Paused")}><Pause className="h-4 w-4" />Pause</Button>
          ) : (
            <Button variant="outline" className="rounded-full" onClick={() => patch({ status: "active" }, "Active again")}><Play className="h-4 w-4" />Resume</Button>
          )}
          <Button variant="outline" className="rounded-full" disabled={item.status === "cancelled"} onClick={() => patch({ status: "cancelled" }, "Marked as cancelled")}><XCircle className="h-4 w-4" />Cancelled</Button>
          <Button variant="outline" className="rounded-full text-destructive" onClick={() => setConfirmDel(true)}><Trash2 className="h-4 w-4" />Delete</Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {item.last_reviewed_at ? `Last reviewed ${format(new Date(item.last_reviewed_at), "d MMM yyyy")}` : "Not reviewed yet — that doesn't mean it's unused, just that you haven't checked."}
        </p>
      </section>

      <section className="rounded-3xl bg-card p-6 shadow-card">
        <h2 className="font-display font-bold">Price history</h2>
        {history.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No price changes yet. When you update the amount, we'll keep a record here.</p> : (
          <ul className="mt-3 divide-y divide-border text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-2.5">
                <span className="text-muted-foreground">{format(new Date(h.changed_at), "d MMM yyyy")}</span>
                <span className="num">{formatMoney(Number(h.old_amount), item.currency)} → <b className={Number(h.new_amount) > Number(h.old_amount) ? "text-destructive" : "text-success"}>{formatMoney(Number(h.new_amount), item.currency)}</b></span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl bg-card p-6 shadow-card">
        <Accordion type="single" collapsible>
          <AccordionItem value="cancel" className="border-none">
            <AccordionTrigger className="py-0 font-display text-base font-bold hover:no-underline">How to cancel {item.name}</AccordionTrigger>
            <AccordionContent className="pt-4">
              <ol className="list-decimal space-y-2 pl-5 text-sm">{guide.map((s, i) => <li key={i}>{s}</li>)}</ol>
              <p className="mt-3 text-xs text-muted-foreground">Steps can change — check the provider's app if something looks different. Once done, tap "Cancelled" above.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <ItemForm open={editing} onOpenChange={setEditing} item={item} />
      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader><AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
            <AlertDialogDescription>This removes it and its price history. If you just stopped paying, mark it as cancelled instead.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Keep it</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground" onClick={async () => { await del.mutateAsync(id); toast.success("Deleted"); navigate({ to: "/subscriptions" }); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
