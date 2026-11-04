// Typical prices are rough starting points — users edit them before saving.
export interface Preset {
  key: string;
  name: string;
  type: string;
  category: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  is_usd_billed?: boolean;
  is_variable?: boolean;
  topup_every_days?: number;
  hue: number;
}

export const PRESETS: Preset[] = [
  { key: "netflix", name: "Netflix", type: "subscription", category: "streaming", amount: 5000, currency: "NGN", billing_cycle: "monthly", hue: 25 },
  { key: "spotify", name: "Spotify", type: "subscription", category: "streaming", amount: 1300, currency: "NGN", billing_cycle: "monthly", hue: 150 },
  { key: "youtube", name: "YouTube Premium", type: "subscription", category: "streaming", amount: 1100, currency: "NGN", billing_cycle: "monthly", hue: 28 },
  { key: "dstv", name: "DSTV", type: "bill", category: "streaming", amount: 15700, currency: "NGN", billing_cycle: "monthly", hue: 240 },
  { key: "gotv", name: "GOtv", type: "bill", category: "streaming", amount: 6500, currency: "NGN", billing_cycle: "monthly", hue: 140 },
  { key: "showmax", name: "Showmax", type: "subscription", category: "streaming", amount: 3500, currency: "NGN", billing_cycle: "monthly", hue: 340 },
  { key: "prime", name: "Prime Video", type: "subscription", category: "streaming", amount: 4.99, currency: "USD", billing_cycle: "monthly", is_usd_billed: true, hue: 220 },
  { key: "icloud", name: "Apple iCloud", type: "subscription", category: "cloud", amount: 0.99, currency: "USD", billing_cycle: "monthly", is_usd_billed: true, hue: 210 },
  { key: "googleone", name: "Google One", type: "subscription", category: "cloud", amount: 1.99, currency: "USD", billing_cycle: "monthly", is_usd_billed: true, hue: 200 },
  { key: "mtn", name: "MTN Data", type: "bill", category: "internet", amount: 3500, currency: "NGN", billing_cycle: "monthly", is_variable: true, topup_every_days: 30, hue: 85 },
  { key: "airtel", name: "Airtel Data", type: "bill", category: "internet", amount: 3000, currency: "NGN", billing_cycle: "monthly", is_variable: true, topup_every_days: 30, hue: 20 },
  { key: "glo", name: "Glo Data", type: "bill", category: "internet", amount: 2500, currency: "NGN", billing_cycle: "monthly", is_variable: true, topup_every_days: 30, hue: 135 },
  { key: "rent", name: "Rent", type: "rent", category: "housing", amount: 1200000, currency: "NGN", billing_cycle: "yearly", hue: 50 },
];

export function avatarHue(name: string) {
  const p = PRESETS.find((x) => name.toLowerCase().startsWith(x.name.toLowerCase().split(" ")[0] ?? ""));
  if (p) return p.hue;
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
