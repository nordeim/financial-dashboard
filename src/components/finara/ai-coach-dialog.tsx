"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X } from "lucide-react";
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
      {/* Live-exact (round 9 raw capture): the card renders the live
          Card-component merge order — text-card-foreground/shadow/w-full/
          max-w-2xl/h-[80vh] BEFORE bg-white — which tailwind-merge cannot
          reproduce from DIALOG_CARD_BASE, hence the full cardClassName. */}
      <DialogContent
        cardClassName="rounded-xl border text-card-foreground shadow w-full max-w-2xl h-[80vh] bg-white dark:bg-gray-800 flex flex-col"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <DialogHeader className="shrink-0">
          {/* Round-6: live header row — title + in-flow close button. */}
          <div className="flex items-center justify-between">
            <DialogTitle className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
              <Bot className="w-5 h-5" aria-hidden />
              AI Financial Coach
            </DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </DialogHeader>

        {/* Live body wrapper order (round 9): p-6 pt-0 flex-1 flex flex-col min-h-0. */}
        <div className="p-6 pt-0 flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-4">
            <div ref={scrollRef} className="space-y-4 pb-4">
              {messages.map((message, index) =>
                message.role === "user" ? (
                  <div key={index} className="flex gap-3 justify-end">
                    <div className="max-w-[85%] flex flex-col items-end">
                      <div className="rounded-2xl px-4 py-2.5 bg-slate-800 dark:bg-slate-600 text-white">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={index} className="flex gap-3 justify-start">
                    <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" aria-hidden />
                    </div>
                    <div className="max-w-[85%]">
                      <div className="rounded-2xl px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                        {/* Live renders the reply as markdown inside a prose block;
                            each paragraph carries the live-exact classes. */}
                        <div className="text-sm prose prose-sm prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <Markdown
                            components={{
                              // react-markdown v10 passes a `node` prop to
                              // custom components — strip it or it leaks onto
                              // the DOM as node="[object Object]" (round-6).
                              p: ({ node: _node, ...props }) => (
                                <p className="my-1 leading-relaxed text-slate-700 dark:text-slate-300" {...props} />
                              ),
                            }}
                          >
                            {message.content}
                          </Markdown>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </ScrollArea>

          {messages.length <= 1 ? (
            <div className="mt-4 mb-4">
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <Button
                    key={question}
                    type="button"
                    variant="outline"
                    onClick={() => void send(question)}
                    className="h-8 rounded-md px-3 text-xs"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Round 9 live capture: the input row is a DIV (flex gap-2 mt-4),
              not a form — Enter-to-send is wired through the input's keydown. */}
          <div className="flex gap-2 mt-4">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void send(draft);
                }
              }}
              placeholder="Ask me about your finances..."
              aria-label="Ask the AI coach about your finances"
              maxLength={500}
              className="flex-1"
            />
            <Button
              type="button"
              size="icon"
              disabled={!draft.trim() || sending}
              aria-label="Send message"
              onClick={() => void send(draft)}
            >
              <Send className="w-4 h-4" aria-hidden />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
