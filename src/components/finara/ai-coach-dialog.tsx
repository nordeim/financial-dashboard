"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Loader2, Send, Sparkles, Target, TrendingDown, TrendingUp } from "lucide-react";
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

const QUICK_ACTIONS = [
  { label: "Add Income", icon: TrendingUp, kind: "income" as const },
  { label: "Add Expense", icon: TrendingDown, kind: "expense" as const },
  { label: "Set Goal", icon: Target, kind: "goal" as const },
  { label: "View Reports", icon: Sparkles, kind: "reports" as const },
];

const GREETING: AiChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm your Finara AI coach. Ask me about your spending, budgets, savings goals or investments — I ground every answer in your current data.",
};

export function AiCoachDialog({
  open,
  onOpenChange,
  onQuickAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuickAction: (action: "add-income" | "add-expense" | "set-goal" | "view-reports") => void;
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
      <DialogContent className="flex h-[85vh] max-w-lg flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
              <Brain className="h-5 w-5 text-violet-600" aria-hidden />
            </span>
            AI Coach
          </DialogTitle>
          <DialogDescription>Ask anything about your finances — answers use your live data.</DialogDescription>
        </DialogHeader>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  switch (action.kind) {
                    case "income":
                      onQuickAction("add-income");
                      break;
                    case "expense":
                      onQuickAction("add-expense");
                      break;
                    case "goal":
                      onQuickAction("set-goal");
                      break;
                    case "reports":
                      onQuickAction("view-reports");
                      break;
                  }
                  onOpenChange(false);
                }}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-600 transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
              >
                <action.icon className="h-4 w-4" aria-hidden />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div ref={scrollRef} className="space-y-3 pr-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-500 px-3.5 py-2.5 text-sm text-white shadow-sm"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm"
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}
            {sending ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-500" aria-hidden />
                  <span className="text-sm text-slate-400">Thinking…</span>
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>

        {messages.length <= 1 ? (
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => void send(question)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
              >
                {question}
              </button>
            ))}
          </div>
        ) : null}

        <form
          className="flex items-center gap-2"
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
          <Button type="submit" size="icon" className="bg-emerald-500 hover:bg-emerald-600" disabled={!draft.trim() || sending} aria-label="Send message">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
