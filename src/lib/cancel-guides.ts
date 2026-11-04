const GUIDES: Record<string, string[]> = {
  netflix: ["Open netflix.com and sign in.", "Go to Account → Membership.", "Tap “Cancel membership” and confirm.", "You keep access until the end of the paid period."],
  spotify: ["Go to spotify.com/account in a browser (not the app).", "Open “Manage your plan”.", "Choose “Cancel Premium” and confirm."],
  youtube: ["Open youtube.com/paid_memberships.", "Select YouTube Premium → Deactivate.", "Confirm the cancellation."],
  dstv: ["Open the MyDStv or DStv app, or dial *288#.", "Choose your account → Manage subscription.", "Stop auto-renewal, or simply don't renew when it expires (DStv is prepaid)."],
  gotv: ["Open the MyGOtv app or dial *288#.", "GOtv is prepaid — just don't renew when it expires.", "Turn off any auto-debit you set up with your bank."],
  showmax: ["Sign in at showmax.com → My Account.", "Open Subscription → Cancel subscription.", "If billed through your mobile network, cancel with them instead."],
  prime: ["Go to amazon.com → Prime Video settings → Account & Settings.", "Under Prime membership, choose End membership.", "Confirm."],
  apple: ["Open Settings on your iPhone → your name → iCloud.", "Tap Manage Account Storage → Change Storage Plan.", "Choose Downgrade options → Free (5 GB)."],
  google: ["Open one.google.com → Settings.", "Tap Cancel membership.", "Confirm. Your storage drops to 15 GB at the end of the period."],
  mtn: ["Dial *312# or open the MyMTN app.", "Go to Data plans → Manage/Stop auto-renewal.", "Confirm to stop the recurring bundle."],
  airtel: ["Dial *312# or open the MyAirtel app.", "Choose Manage/stop auto-renewal.", "Confirm."],
  glo: ["Dial *777# or open the Glo Café app.", "Select Data → Stop auto-renewal.", "Confirm."],
};

export function cancelGuide(name: string): string[] {
  const n = name.toLowerCase();
  const key = Object.keys(GUIDES).find((k) => n.includes(k));
  return key ? GUIDES[key] : [
    "Log in to the provider's website or app.",
    "Look for Account, Billing or Subscription settings.",
    "Turn off auto-renewal or choose Cancel.",
    "If you pay by card auto-debit, you can also ask your bank to stop it.",
    "Save the confirmation email or screenshot.",
  ];
}
