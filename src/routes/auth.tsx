import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/billwise/Logo";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signin" | undefined } => (s["mode"] === "signin" ? { mode: "signin" } : {}),
  head: () => ({
    meta: [
      { title: "Sign in — Billwise" },
      { name: "description", content: "Sign in or create your free Billwise account." },
      { property: "og:title", content: "Sign in — Billwise" },
      { property: "og:description", content: "Sign in or create your free Billwise account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(initial ?? "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && navigate({ to: "/overview" }));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => s && navigate({ to: "/overview" }));
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/overview", data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (res.error) toast.error(res.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-sm px-6 py-10">
        <Logo />
        {sent ? (
          <div className="mt-12 rounded-3xl bg-card p-6 shadow-card">
            <h1 className="font-display text-2xl font-bold">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Tap it to finish creating your account.
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-display mt-10 text-3xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signup" ? "Free forever for reminders. Takes a minute." : "Sign in to see what's due."}
            </p>
            <Button type="button" variant="outline" className="mt-8 h-12 w-full rounded-full text-base" onClick={google}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v3.2h5.35c-.5 2.4-2.6 3.9-5.35 3.9a6.2 6.2 0 1 1 4-10.9l2.3-2.3A9.5 9.5 0 1 0 21.5 12c0-.3 0-.6-.15-.9z"/></svg>
              Continue with Google
            </Button>
            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />or use email<span className="h-px flex-1 bg-border" />
            </div>
            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5"><Label htmlFor="name">Your name</Label>
                  <Input id="name" className="h-12 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Okafor" /></div>
              )}
              <div className="space-y-1.5"><Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required className="h-12 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={6} className="h-12 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base">
                {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
              </Button>
            </form>
            <button className="mt-6 w-full text-center text-sm text-muted-foreground" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
              {mode === "signup" ? "Already have an account? " : "New here? "}
              <span className="font-semibold text-primary">{mode === "signup" ? "Sign in" : "Create one"}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
