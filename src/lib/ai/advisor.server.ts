import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "./run-id.server";

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json" } });

export async function handleAdvisor(request: Request): Promise<Response> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json(401, "Please sign in again.");
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const supabase = createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}`, apikey: key } },
  });
  const { data: userData, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !userData.user) return json(401, "Please sign in again.");

  let body: { threadId?: string; message?: string };
  try { body = await request.json(); } catch { return json(400, "Invalid request."); }
  const text = (body.message ?? "").trim().slice(0, 4000);
  if (!text || !body.threadId) return json(400, "Ask a question first.");
  const { data: thread } = await supabase.from("chat_threads").select("id,title").eq("id", body.threadId).maybeSingle();
  if (!thread) return json(404, "Conversation not found.");
  const { error: insErr } = await supabase.from("chat_messages").insert({ thread_id: thread.id, role: "user", content: text });
  if (insErr) return json(500, "Couldn't save your message.");
  const { data: hist } = await supabase.from("chat_messages").select("role,content").eq("thread_id", thread.id).order("created_at", { ascending: false }).limit(30);
  const messages: ModelMessage[] = (hist ?? []).reverse().map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  if (thread.title === "New chat") {
    await supabase.from("chat_threads").update({ title: text.slice(0, 60) }).eq("id", thread.id);
  }

  const [{ data: items }, { data: profile }] = await Promise.all([
    supabase.from("items").select("name,type,category,amount,currency,billing_cycle,next_due_date,status,is_variable,is_usd_billed,last_paid_at,notes"),
    supabase.from("profiles").select("currency,country").eq("id", userData.user.id).maybeSingle(),
  ]);

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return json(500, "AI is not configured.");
  const today = new Date().toISOString().slice(0, 10);
  const instructions = `You are Billwise's friendly assistant. Answer any question the user asks helpfully — about their bills, saving money, how to use Billwise (add items, mark bills paid, filters, CSV export, demo data, settings), or general topics. When the question is about their money, act as a money advisor.
Today is ${today}.`.replace(/Today is .*$/, "") + `You are also a money advisor.`;
  void instructions;
  const system = `You are Billwise's friendly assistant and money advisor. Answer any question helpfully: about the user's bills and subscriptions, saving money, how to use Billwise (adding items, marking bills paid, bill filters, CSV export, demo data), or general topics. Today is ${today}. The user's home currency is ${profile?.currency ?? "NGN"}${profile?.country ? ` and they live in ${profile.country}` : ""}.
Answer questions about their subscriptions and bills using ONLY the data below, and give specific, personalised cost-saving recommendations (cancel unused, downgrade plans, switch to yearly, bundle, avoid USD card fees, pay overdue bills to avoid penalties). Quote amounts with currency. Be concise, use short bullet points, and never invent items.
User's items (JSON):
${JSON.stringify(items ?? [])}`;

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions,
    messages,
    abortSignal: request.signal,
    maxRetries: 0,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return result.toTextStreamResponse({ headers: { "Cache-Control": "no-cache, no-transform" } });
}
