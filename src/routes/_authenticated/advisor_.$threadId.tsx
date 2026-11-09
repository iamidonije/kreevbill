import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { RichText } from "@/components/billwise/RichText";
import { NewChatButton, ThreadList } from "@/components/billwise/ThreadList";
import { useInvalidateChats, useThreadMessages, type ChatMsg } from "@/lib/chat";

export const Route = createFileRoute("/_authenticated/advisor_/$threadId")({
  head: () => ({ meta: [
    { title: "Chat — Ask Billwise" },
    { name: "description", content: "A conversation with Ask Billwise about your bills and savings." },
    { property: "og:title", content: "Chat — Ask Billwise" },
    { property: "og:description", content: "A conversation with Ask Billwise." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ThreadPage,
});

const SUGGESTIONS = [
  "Where can I save money this month?",
  "Which subscriptions should I cancel?",
  "How do I export my bills?",
  "What's overdue and what will it cost me?",
];

function ThreadPage() {
  const { threadId } = Route.useParams();
  return <Chat key={threadId} threadId={threadId} />;
}

function Chat({ threadId }: { threadId: string }) {
  const { data: saved, isLoading } = useThreadMessages(threadId);
  const refresh = useInvalidateChats();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (saved) setMsgs(saved); }, [saved]);
  useEffect(() => { if (!busy) inputRef.current?.focus(); }, [busy, threadId]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setMsgs((m) => [...m.filter((x) => !x.error), { role: "user", content: q }, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const setLast = (fn: (m: ChatMsg) => ChatMsg) => setMsgs((all) => [...all.slice(0, -1), fn(all[all.length - 1]!)]);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify({ threadId, message: q }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        const msg = res.status === 402 ? "AI credits have run out. Add credits to keep chatting."
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
      else setLast(() => ({ role: "assistant", content: "Couldn't reach Ask Billwise. Check your connection.", error: true }));
    } finally {
      setBusy(false);
      abortRef.current = null;
      refresh();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="hidden space-y-3 lg:block">
        <NewChatButton className="w-full" />
        <ThreadList activeId={threadId} />
      </aside>
      <div className="flex min-h-[70vh] flex-col space-y-5">
        <header className="flex items-center gap-2">
          <Link to="/advisor" className="rounded-full p-2 hover:bg-muted lg:hidden" aria-label="All chats"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-display text-2xl font-bold">Ask Billwise</h1>
        </header>
        <div className="flex-1 space-y-3">
          {!isLoading && !msgs.length && (
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)} className="rounded-2xl border border-border bg-card p-4 text-left text-sm shadow-card transition hover:border-primary">{s}</button>
              ))}
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm ${m.role === "user" ? "whitespace-pre-wrap bg-primary text-primary-foreground" : m.error ? "bg-destructive/10 text-destructive" : "bg-card shadow-card"}`}>
                {m.content ? (m.role === "assistant" && !m.error ? <RichText text={m.content} /> : m.content)
                  : busy && i === msgs.length - 1 ? <span className="animate-pulse text-muted-foreground">Thinking…</span> : null}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="sticky bottom-24 flex gap-2 lg:bottom-4">
          <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Billwise anything…" className="h-12 rounded-full bg-card" aria-label="Ask Billwise" />
          {busy
            ? <Button type="button" size="icon" variant="outline" className="h-12 w-12 rounded-full" onClick={() => abortRef.current?.abort()} aria-label="Stop"><Square className="h-4 w-4" /></Button>
            : <Button type="submit" size="icon" className="h-12 w-12 rounded-full" aria-label="Send"><Send className="h-4 w-4" /></Button>}
        </form>
      </div>
    </div>
  );
}
