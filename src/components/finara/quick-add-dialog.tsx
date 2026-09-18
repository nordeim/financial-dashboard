"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, TrendingDown, TrendingUp, X } from "lucide-react";
import { mutate } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { toMinorUnits } from "@/lib/money";

/**
 * FAB Quick Add dialog (round 4, live-verified 2026-09-15). The live app's
 * FAB opens a two-step chooser — NOT the full Add Expense form:
 *   step 1: "Quick Add" chooser (Add Income / Add Expense)
 *   step 2: compact form (description|name, amount, category) + Back/Add
 * Submitting creates the record with subcategory "other" (expenses) and
 * frequency "monthly" (income) — exactly the live behavior (probed).
 * The full Quick Select modal stays on the Expenses header button.
 */

type Step = "chooser" | "expense" | "income";

/** Live category option labels (id → display). */
const EXPENSE_CATEGORIES = [
  { id: "needs", label: "Needs" },
  { id: "wants", label: "Wants" },
  { id: "savings", label: "Savings" },
] as const;

const INCOME_CATEGORIES = [
  { id: "primary", label: "Primary Income" },
  { id: "secondary", label: "Secondary Income" },
  { id: "passive", label: "Passive Income" },
  { id: "other", label: "Other" },
] as const;

export function QuickAddDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const [step, setStep] = useState<Step>("chooser");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("needs");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setStep("chooser");
    setDescription("");
    setAmount("");
    setCategory("needs");
    setSubmitting(false);
  };

  const close = (next: boolean) => {
    if (!next) {
      onOpenChange(false);
      reset();
    }
  };

  const start = (next: Step) => {
    setStep(next);
    setCategory(next === "income" ? "primary" : "needs");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const minor = toMinorUnits(amount);
    if (!description.trim() || !Number.isFinite(minor) || minor <= 0) return;
    setSubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const result =
        step === "expense"
          ? await mutate("/api/expenses", "POST", {
              description: description.trim(),
              amountMinor: minor,
              category: category === "needs" ? "Needs" : category === "wants" ? "Wants" : "Savings",
              subcategory: "other",
              date: today,
              notes: "",
              recurring: false,
            })
          : await mutate("/api/income", "POST", {
              name: description.trim(),
              amountMinor: minor,
              frequency: "monthly",
              category,
              active: true,
              nextPaymentDate: today,
            });
      if (result.ok) {
        toast({ title: step === "expense" ? "Expense added" : "Income source added" });
        onOpenChange(false);
        reset();
        onSaved?.();
      } else {
        toast({ title: "Could not save", description: result.error, variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // modal={false} (round-12 live probe): Radix's modal lock sets
    // pointer-events:none on <body>, which deadens the z-50 FAB while the
    // chooser is open — but the live's FAB STAYS clickable and acts as the
    // close toggle (elementFromPoint at its center resolves inside the FAB).
    // Non-modal also matches the live's plain-div chooser (no focus trap,
    // no aria-hidden on the app behind). Overlay-click dismiss is the
    // content's own onPointerDown below; Escape still closes.
    <Dialog open={open} onOpenChange={close} modal={false}>
      {/* z-40 overlay: the sage FAB (z-50) stays above the chooser and acts
          as the close toggle on the live app (its plus icon rotates to an X). */}
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-40"
        widthWrapperClassName="w-full max-w-md"
        cardClassName="rounded-xl border text-card-foreground shadow bg-white dark:bg-gray-800"
        aria-describedby={undefined}
        onPointerDown={(event) => {
          // Live probe (round 6): the Quick Add chooser DOES dismiss on an
          // overlay click (unlike the full modals, which stay open).
          if (event.target === event.currentTarget) close(false);
        }}
        onInteractOutside={(event) => {
          // Round-12: non-modal Radix dismisses on outside POINTERDOWN and
          // on outside FOCUS (the FAB takes focus on mousedown). Either path
          // closes the chooser before the FAB's own click-toggle runs, which
          // then re-opens it (close→toggle double fire — traced live). On
          // the live app the FAB is the ONLY outside actor and plain divs
          // carry no dismiss/focus logic, so suppress Radix's outside
          // interaction handling entirely; the overlay-click dismiss above
          // and Escape still close.
          event.preventDefault();
        }}
      >
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <DialogTitle asChild>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Add</h3>
            </DialogTitle>
            <button
              type="button"
              onClick={() => close(false)}
              aria-label="Close"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {step === "chooser" ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">What would you like to add?</p>
              <Button
                variant="outline"
                onClick={() => start("income")}
                className="h-12 w-full justify-start gap-3"
              >
                <TrendingUp className="w-5 h-5 text-emerald-500" aria-hidden />
                <span>Add Income</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => start("expense")}
                className="h-12 w-full justify-start gap-3"
              >
                <TrendingDown className="w-5 h-5 text-red-500" aria-hidden />
                <span>Add Expense</span>
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={step === "expense" ? "Expense description..." : "Income source..."}
                required
                aria-label={step === "expense" ? "Expense description" : "Income source name"}
              />
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Amount"
                required
                aria-label="Amount"
              />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(step === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("chooser")}>
                  Back
                </Button>
                {/* Round 8 (F13 — live-probed): flex-1 both sides, the default
                    variant's shadow survives the sage overrides, a Check glyph
                    precedes the label, and the button stays disabled until
                    BOTH fields are filled (live behavior). */}
                <Button
                  type="submit"
                  disabled={submitting || !description.trim() || !amount.trim()}
                  className="flex-1 bg-primary-sage hover:bg-primary-sage/90"
                >
                  <Check className="w-4 h-4 mr-1" aria-hidden /> Add
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
