import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { Brain, Send, Sparkles } from "lucide-react";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";

export const Route = createFileRoute("/_authenticated/copilot")({
  head: () => ({ meta: [{ title: "Restaurant Copilot — SecondBite AI" }] }),
  component: CopilotPage,
});

const SUGGESTIONS = [
  "Why did revenue drop yesterday?",
  "How much paneer should I order tomorrow?",
  "Which dish should I remove from the menu?",
  "Draft a Diwali marketing campaign.",
  "Who is my best performing staff this week?",
];

function CopilotPage() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, status } = useChat({
    id: "copilot-main",
    transport: new DefaultChatTransport({ api: "/api/copilot" }),
    onError: (e) => console.error("[copilot]", e),
  });

  useEffect(() => { textareaRef.current?.focus(); }, []);
  useEffect(() => { if (status === "ready") textareaRef.current?.focus(); }, [status]);

  const submit = async (text: string) => {
    const t = text.trim();
    if (!t || status === "submitted" || status === "streaming") return;
    setInput("");
    await sendMessage({ text: t });
  };

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <header className="border-b border-white/5 bg-white/[0.02] px-6 py-4 md:px-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-400/80">
              <Sparkles className="h-3 w-3" /> AI Copilot · Gemini 3
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Restaurant Copilot</h1>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-[10px] font-medium text-emerald-300 md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Trained on your operations
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden">
        <Conversation className="flex-1">
          <ConversationContent className="px-4 py-6 md:px-8">
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<Brain className="h-10 w-10 text-amber-400" />}
                title="What should I run for you today?"
                description="Your Copilot has context on covers, revenue, staff, inventory, reviews, and forecasts."
              >
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => submit(s)}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70 transition hover:border-amber-400/30 hover:text-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </ConversationEmptyState>
            ) : (
              messages.map((m) => {
                const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
                return (
                  <Message key={m.id} from={m.role === "user" ? "user" : "assistant"}>
                    {m.role === "user" ? (
                      <MessageContent>{text}</MessageContent>
                    ) : (
                      <MessageContent>
                        <MessageResponse>{text}</MessageResponse>
                      </MessageContent>
                    )}
                  </Message>
                );
              })
            )}
            {status === "submitted" && (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer>Copilot is analyzing…</Shimmer>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <form
          onSubmit={(e) => { e.preventDefault(); void submit(input); }}
          className="border-t border-white/5 bg-[oklch(0.13_0.008_60)] p-4 md:p-6"
        >
          <div className="relative flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 focus-within:border-amber-400/40">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit(input);
                }
              }}
              rows={1}
              placeholder="Ask your Copilot anything — inventory, staffing, revenue, reviews…"
              className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
              disabled={status === "submitted" || status === "streaming"}
            />
            <button
              type="submit"
              disabled={!input.trim() || status === "submitted" || status === "streaming"}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-black transition disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 text-[10px] text-white/30">
            AI can make mistakes. Decisions with financial impact should be reviewed before executing.
          </div>
        </form>
      </div>
    </main>
  );
}
