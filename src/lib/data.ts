import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { BillItem } from "./billing";
import { DEFAULT_FX } from "./billing";

export interface Profile {
  id: string;
  full_name: string | null;
  country: string | null;
  currency: string;
  plan: string;
  fx_rates: Record<string, number>;
  onboarded: boolean;
  notification_prefs: Record<string, unknown>;
}

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Please sign in again.");
  return data.user.id;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile> => {
      const id = await uid();
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: created, error: e2 } = await supabase.from("profiles").insert({ id }).select().single();
        if (e2) throw e2;
        return { ...(created as unknown as Profile), fx_rates: DEFAULT_FX };
      }
      const p = data as unknown as Profile;
      return { ...p, fx_rates: { ...DEFAULT_FX, ...(p.fx_rates ?? {}) } };
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const id = await uid();
      const { error } = await supabase.from("profiles").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: async (): Promise<BillItem[]> => {
      const { data, error } = await supabase.from("items").select("*").order("next_due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []).map((d) => ({ ...d, amount: Number(d.amount) })) as BillItem[];
    },
  });
}

export function usePriceHistory(itemId: string) {
  return useQuery({
    queryKey: ["price_history", itemId],
    queryFn: async () => {
      const { data, error } = await supabase.from("price_history").select("*").eq("item_id", itemId).order("changed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSavingsActions() {
  return useQuery({
    queryKey: ["savings_actions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("savings_actions").select("*");
      if (error) throw error;
      return (data ?? []).map((d) => ({ ...d, estimated_monthly_saving: Number(d.estimated_monthly_saving) }));
    },
  });
}

export type ItemInput = Partial<Omit<BillItem, "id" | "created_at">>;

export function useSaveItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string | undefined; values: ItemInput | Record<string, unknown> }) => {
      if (id) {
        const { error } = await supabase.from("items").update(values as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("items").insert({ ...(values as Record<string, unknown>), user_id: await uid() });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["price_history"] });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

const d = (n: number) => format(addDays(new Date(), n), "yyyy-MM-dd");

export async function seedDemo() {
  const user_id = await uid();
  const rows = [
    { name: "Netflix", type: "subscription", category: "streaming", amount: 5000, billing_cycle: "monthly", next_due_date: d(2) },
    { name: "DSTV Compact", type: "bill", category: "streaming", amount: 15700, billing_cycle: "monthly", next_due_date: d(-1) },
    { name: "Spotify", type: "subscription", category: "streaming", amount: 1300, billing_cycle: "monthly", next_due_date: d(12) },
    { name: "Apple iCloud", type: "subscription", category: "cloud", amount: 2.99, currency: "USD", is_usd_billed: true, billing_cycle: "monthly", next_due_date: d(3) },
    { name: "MTN Data", type: "bill", category: "internet", amount: 3500, billing_cycle: "monthly", is_variable: true, topup_every_days: 14, next_due_date: d(5) },
    { name: "Electricity (IKEDC)", type: "bill", category: "utilities", amount: 20000, billing_cycle: "monthly", is_variable: true, topup_every_days: 21, next_due_date: d(9) },
    { name: "Gym membership", type: "subscription", category: "fitness", amount: 25000, billing_cycle: "monthly", next_due_date: d(18) },
    { name: "Rent", type: "rent", category: "housing", amount: 1500000, billing_cycle: "yearly", next_due_date: d(120) },
  ].map((r) => ({ currency: "NGN", ...r, user_id, is_demo: true }));
  const { error } = await supabase.from("items").insert(rows as never);
  if (error) throw error;
  const { data: items } = await supabase.from("items").select("id,name").eq("is_demo", true);
  const gym = items?.find((i) => i.name === "Gym membership");
  const dstv = items?.find((i) => i.name === "DSTV Compact");
  await supabase.from("savings_actions").insert([
    { user_id, item_id: dstv?.id ?? null, action_type: "downgrade", estimated_monthly_saving: 6000, confirmed: true, is_demo: true },
    { user_id, item_id: gym?.id ?? null, action_type: "negotiate", estimated_monthly_saving: 5000, confirmed: false, is_demo: true },
  ]);
}

export async function clearDemo() {
  await supabase.from("savings_actions").delete().eq("is_demo", true);
  const { error } = await supabase.from("items").delete().eq("is_demo", true);
  if (error) throw error;
}
