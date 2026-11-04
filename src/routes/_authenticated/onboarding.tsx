import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { addMonths, format } from "date-fns";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/billwise/Logo";
import { ItemAvatar } from "@/components/billwise/ItemAvatar";
import { PRESETS } from "@/lib/presets";
import { CURRENCIES, CURRENCY_SYMBOL, FREE_ITEM_LIMIT, formatMoney } from "@/lib/billing";
import { seedDemo, useUpdateProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Get set up — Billwise" }, { name: "description", content: "Set up your Billwise account." }] }),
  component: Onboarding,
});

const COUNTRIES = [
  { code: "NG", name: "Nigeria", currency: "NGN" }, { code: "GH", name: "Ghana", currency: "GHS" },
  { code: "KE", name: "Kenya", currency: "KES" }, { code: "ZA", name: "South Africa", currency: "ZAR" },
  { code: "GB", name: "United Kingdom", currency: "GBP" }, { code: "US", name: "United States", currency: "USD" },
  { code: "CA", name: "Canada", currency: "CAD" },
];

function Onboarding() {
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState("NG");
  const [currency, setCurrency] = useState("NGN");
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const update = useUpdateProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function finish(withDemo = false) {
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user_id = data.user!.id;
      const due = format(addMonths(new Date(), 1), "yyyy-MM-dd");
      const rows = PRESETS.filter((p) => picked.includes(p.key)).map((p) => ({
        user_id, name: p.name, type: p.type, category: p.category, amount: p.amount, currency: p.currency,
        billing_cycle: p.billing_cycle, is_usd_billed: !!p.is_usd_billed, is_variable: !!p.is_variable,
        topup_every_days: p.topup_every_days ?? null, next_due_date: due,
      }));
      if (rows.length) {
        const { error } = await supabase.from("items").insert(rows as never);
        if (error) throw error;
      }
      if (withDemo) await seedDemo();
      await update.mutateAsync({ country, currency, onboarded: true });
      await qc.invalidateQueries();
      navigate({ to: "/overview" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const toggle = (k: string) => setPicked((p) => p.includes(k) ? p.filter((x) => x !== k) : p.length >= FREE_ITEM_LIMIT ? p : [...p, k]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-6 pb-32 pt-8">
        <div className="flex items-center justify-between"><Logo /><span className="text-xs text-muted-foreground">Step {step + 1} of 2</span></div>
        {step === 0 ? (
          <>
            <h1 className="font-display mt-10 text-3xl font-bold">Where are you based?</h1>
            <p className="mt-2 text-sm text-muted-foreground">We'll show your totals in your local currency.</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {COUNTRIES.map((c) => (
                <button key={c.code} onClick={() => { setCountry(c.code); setCurrency(c.currency); }}
                  className={`rounded-2xl border p-4 text-left transition ${country === c.code ? "border-primary bg-primary-soft" : "border-border bg-card"}`}>
                  <p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">{c.currency}</p>
                </button>
              ))}
            </div>
            <p className="mt-8 text-sm font-medium">Currency for totals</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CURRENCIES.map((c) => (
                <button key={c} onClick={() => setCurrency(c)} className={`rounded-full border px-4 py-2 text-sm ${currency === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                  {CURRENCY_SYMBOL[c]} {c}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display mt-10 text-3xl font-bold">What do you pay for?</h1>
            <p className="mt-2 text-sm text-muted-foreground">Tap to add. You can change prices and dates later.</p>
            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {PRESETS.map((p) => {
                const on = picked.includes(p.key);
                return (
                  <button key={p.key} onClick={() => toggle(p.key)}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition ${on ? "border-primary bg-primary-soft" : "border-border bg-card"}`}>
                    {on && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span>}
                    <ItemAvatar name={p.name} size={40} />
                    <span className="text-xs font-semibold leading-tight">{p.name}</span>
                    <span className="num text-[11px] text-muted-foreground">{formatMoney(p.amount, p.currency, { decimals: p.currency === "USD" })}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-lg gap-2">
          {step === 0 ? (
            <Button className="h-12 flex-1 rounded-full text-base" onClick={() => setStep(1)}>Continue</Button>
          ) : (
            <>
              <Button variant="outline" className="h-12 rounded-full" disabled={busy} onClick={() => finish(true)}>Try with demo data</Button>
              <Button className="h-12 flex-1 rounded-full text-base" disabled={busy} onClick={() => finish(false)}>
                {busy ? "Setting up…" : picked.length ? `Add ${picked.length} & finish` : "Skip for now"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
