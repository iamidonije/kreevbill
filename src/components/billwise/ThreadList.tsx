import { Link, useNavigate } from "@tanstack/react-router";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createThread, deleteThread, useInvalidateChats, useThreads } from "@/lib/chat";

export function NewChatButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  const refresh = useInvalidateChats();
  return (
    <Button className={`rounded-full ${className ?? ""}`} onClick={async () => {
      try { const id = await createThread(); await refresh(); navigate({ to: "/advisor/$threadId", params: { threadId: id } }); }
      catch (e) { toast.error((e as Error).message); }
    }}><MessageSquarePlus className="h-4 w-4" />New chat</Button>
  );
}

export function ThreadList({ activeId }: { activeId?: string }) {
  const { data: threads, isLoading } = useThreads();
  const refresh = useInvalidateChats();
  const navigate = useNavigate();
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading chats…</p>;
  if (!threads?.length) return <p className="text-sm text-muted-foreground">No chats yet.</p>;
  return (
    <ul className="space-y-1">
      {threads.map((t) => (
        <li key={t.id} className={`group flex items-center gap-1 rounded-2xl ${t.id === activeId ? "bg-primary/10" : "hover:bg-muted"}`}>
          <Link to="/advisor/$threadId" params={{ threadId: t.id }} className="min-w-0 flex-1 truncate px-3 py-2 text-sm">{t.title}</Link>
          <button aria-label={`Delete ${t.title}`} className="p-2 text-muted-foreground hover:text-destructive" onClick={async () => {
            try { await deleteThread(t.id); await refresh(); if (t.id === activeId) navigate({ to: "/advisor" }); }
            catch (e) { toast.error((e as Error).message); }
          }}><Trash2 className="h-4 w-4" /></button>
        </li>
      ))}
    </ul>
  );
}
