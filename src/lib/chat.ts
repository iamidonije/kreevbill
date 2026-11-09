import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ChatThread = { id: string; title: string; updated_at: string };
export type ChatMsg = { role: "user" | "assistant"; content: string; error?: boolean };

export function useThreads() {
  return useQuery({
    queryKey: ["chat_threads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chat_threads").select("id,title,updated_at").order("updated_at", { ascending: false });
      if (error) throw error;
      return data as ChatThread[];
    },
  });
}

export function useThreadMessages(threadId: string) {
  return useQuery({
    queryKey: ["chat_messages", threadId],
    queryFn: async () => {
      const { data, error } = await supabase.from("chat_messages").select("role,content").eq("thread_id", threadId).order("created_at");
      if (error) throw error;
      return data as ChatMsg[];
    },
  });
}

export async function createThread(): Promise<string> {
  const { data, error } = await supabase.from("chat_threads").insert({}).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function deleteThread(id: string) {
  const { error } = await supabase.from("chat_threads").delete().eq("id", id);
  if (error) throw error;
}

export function useInvalidateChats() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["chat_threads"] });
}
