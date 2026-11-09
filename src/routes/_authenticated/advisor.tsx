import { createFileRoute } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { NewChatButton, ThreadList } from "@/components/billwise/ThreadList";

export const Route = createFileRoute("/_authenticated/advisor")({
  head: () => ({ meta: [
    { title: "Ask Billwise — your bills assistant" },
    { name: "description", content: "Chat with Ask Billwise about your subscriptions, bills and ways to save." },
    { property: "og:title", content: "Ask Billwise — your bills assistant" },
    { property: "og:description", content: "An AI assistant for your subscriptions, bills and savings." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Chats,
});

function Chats() {
  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold lg:text-3xl"><MessagesSquare className="h-6 w-6 text-primary" />Ask Billwise</h1>
          <p className="text-sm text-muted-foreground">Ask anything — your bills, ways to save, or how the app works.</p>
        </div>
        <NewChatButton />
      </header>
      <section className="rounded-3xl bg-card p-3 shadow-card"><ThreadList /></section>
    </div>
  );
}
