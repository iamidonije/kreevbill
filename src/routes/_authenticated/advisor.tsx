import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Send, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/advisor")({
  head: () => ({ meta: [
    { title: "Savings advisor — Billwise" },
    { name: "description", content: "Ask questions about your subscriptions and bills and get AI-powered ways to save." },
    { property: "og:title", content: "Savings advisor — Billwise" },
    { property: "og:description", content: "AI-powered cost-saving tips for your subscriptions and bills." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Advisor,
});

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };
const SUGGESTIONS = [
  "Where can I save money this month?",
  "Which subscriptions should I cancel?",
  "How much do I spend on streaming?",
  "What's overdue and what will it cost me?",
];

function Advisor() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const history: Msg[] = [...msgs.filter((m) => !m.error), { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const setLast = (fn: (m: Msg) => Msg) => setMsgs((all) => [...all.slice(0, -1), fn(all[all.length - 1])]);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        const msg = res.status === 402 ? "AI credits have run out. Add credits to keep using the advisor."
          : res.status === 429 ? "Too many requests right now. Please wait a moment and try again."
          : err.error ?? "Something went wrong. Please try again.";
        setLast(() => ({ role: "assistant", content: msg, error: true }));
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        setLast((m) => ({ ...m, content: m.content + chunk }));
      }
      setLast((m) => (m.content ? m : { ...m, content: "No answer came back. Please try again.", error: true }));
    } catch (e) {
      if ((e as Error).name === "AbortError") setLast((m) => ({ ...m, content: (m.content || "") + "\n\n_Stopped._" }));
      else setLast(() => ({ role: "assistant", content: "Couldn't reach the advisor. Check your connection.", error: true }));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col space-y-5">
      <header>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold lg:text-3xl"><Sparkles className="h-6 w-6 text-primary" />Savings advisor</h1>
        <p className="text-sm text-muted-foreground">Ask anything about your subscriptions and bills. AI-powered, based on your own list.</p>
      </header>

      <div className="flex-1 space-y-3">
        {!msgs.length && (
          <div className="grid gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="rounded-2xl border border-border bg-card p-4 text-left text-sm shadow-card transition hover:border-primary">{s}</button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : m.error ? "bg-destructive/10 text-destructive" : "bg-card shadow-card"}`}>
              {m.content || (busy && i === msgs.length - 1 ? <span className="animate-pulse text-muted-foreground">Thinking…</span> : null)}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="sticky bottom-24 flex gap-2 lg:bottom-4">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. How can I cut my monthly spend?" className="h-12 rounded-full bg-card" aria-label="Ask the advisor" />
        {busy
          ? <Button type="button" size="icon" variant="outline" className="h-12 w-12 rounded-full" onClick={() => abortRef.current?.abort()} aria-label="Stop"><Square className="h-4 w-4" /></Button>
          : <Button type="submit" size="icon" className="h-12 w-12 rounded-full" aria-label="Send"><Send className="h-4 w-4" /></Button>}
      </form>
    </div>
  );
}
