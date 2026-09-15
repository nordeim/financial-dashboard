"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Loader2, Send } from "lucide-react";
import { mutate } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import type { AiChatMessage } from "@/lib/types";

const SUGGESTED_QUESTIONS = [
  "How much did I spend on dining this month?",
  "What are my top spending categories?",
  "Am I on track with my savings goals?",
  "Show me unusual transactions",
  "How can I save more money?",
];

const GREETING: AiChatMessage = {
  role: "assistant",
  content:
    "👋 Hi! I'm your AI financial advisor. I can help you analyze your spending, identify savings opportunities, and answer questions about your finances. What would you like to know?",
};

export function AiCoachDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [messages, setMessages] = useState<AiChatMessage[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || sending) return;
    const nextMessages: AiChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);
    const result = await mutate<{ reply: string }>("/api/ai/chat", "POST", { messages: nextMessages.slice(-12) });
    setSending(false);
    const { data } = result;
    if (!result.ok || !data) {
      toast({ title: "The AI coach is unavailable", description: result.error, variant: "destructive" });
      setMessages((current) => current.slice(0, -1));
      return;
    }
    setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Live-exact: centered max-w-2xl, h-[80vh], bot-icon header. */}
      <DialogContent className="flex h-[80vh] max-w-2xl flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-primary-navy dark:text-white">
            <Bot className="h-5 w-5" aria-hidden />
            AI Financial Coach
          </DialogTitle>
          <DialogDescription>Ask anything about your finances — answers use your live data.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div ref={scrollRef} className="space-y-4 pb-4">
            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? "flex justify-end gap-3" : "flex justify-start gap-3"}>
                {message.role === "assistant" ? (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" aria-hidden />
                  </div>
                ) : null}
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[85%] rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm text-white shadow-sm"
                      : "max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}
            {sending ? (
              <div className="flex justify-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" aria-hidden />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-400 dark:border-slate-600 dark:bg-slate-700">
                  AI is thinking...
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>

        {messages.length <= 1 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void send(question)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-violet-700 dark:hover:bg-violet-950"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <form
          className="mt-4 mb-4 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
        >
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask me about your finances..."
            aria-label="Ask the AI coach about your finances"
            maxLength={500}
          />
          <Button type="submit" size="icon" className="bg-primary-sage text-white shadow hover:bg-primary-sage/90" disabled={!draft.trim() || sending} aria-label="Send message">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
