"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// Live-exact dialog anatomy (round 4, 2026-09-15): the live app renders ONE
// full-screen overlay div (`fixed inset-0 bg-black/50 flex items-center
// justify-center p-4` + z-40/z-50) that directly contains the centered card
// (`rounded-xl border bg-white dark:bg-gray-800 shadow w-full max-w-2xl
// max-h-[90vh] overflow-y-auto`). To reproduce that DOM shape while keeping
// Radix focus-trap/Esc semantics, the Content renders as the overlay and the
// backdrop is a Radix Close (click-outside dismisses); the card wrapper is a
// plain div that receives the per-dialog width classes.
const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

// Round-6 (ADR-019): the live card carries NO `relative` — every live
// modal's close button sits IN the header row (see quick-add-dialog.tsx for
// the pattern), not absolutely positioned. Exported for the pin spec
// (ui-primitives.test.tsx). Width/max-h/dark-card overrides stay per call
// site via className (live dialog matrix: Add Expense max-w-2xl + scroll,
// income max-w-lg + scroll, investment max-w-md + scroll, goal max-w-md,
// account max-w-md bg-card + black/60 overlay, progress max-w-sm).
export const DIALOG_CARD_BASE =
  "w-full max-w-2xl rounded-xl border bg-white text-card-foreground shadow dark:bg-gray-800"

// Round-6 live probe (2026-09-17): the live overlay itself carries
// bg-black/50 (`fixed inset-0 bg-black/50 flex items-center justify-center
// p-4 z-50`) and clicking it does NOT dismiss the full modals (Add Expense
// stayed open through a real overlay click; only the Quick Add chooser
// dismisses — it wires its own onPointerDown). The backdrop therefore lives
// ON the overlay, not as a separate Radix Close button.
const DIALOG_OVERLAY_BASE =
  "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"

function DialogContent({
  className,
  cardClassName,
  overlayClassName,
  backdropClassName,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  /** Classes for the centered card wrapper (width overrides live here). */
  className?: string
  /**
   * Round 9: FULL card class replacement. The AI Coach card renders via the
   * live Card-component merge (`rounded-xl border text-card-foreground shadow
   * w-full max-w-2xl h-[80vh] bg-white dark:bg-gray-800 flex flex-col`) — a
   * different class ORDER than DIALOG_CARD_BASE produces, and tailwind-merge
   * would collapse a re-stated merge. When provided, the card renders this
   * string alone; callers normally keep using `className`.
   */
  cardClassName?: string
  /** Classes for the full-screen overlay (z-index overrides live here). */
  overlayClassName?: string
  /** Classes for the backdrop layer (live Add Account renders bg-black/60). */
  backdropClassName?: string
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogPrimitive.Content
        className={cn(DIALOG_OVERLAY_BASE, backdropClassName, overlayClassName)}
        {...props}
      >
        <div className={cardClassName ?? cn(DIALOG_CARD_BASE, className)}>
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close className="absolute right-6 top-6 inline-flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      // Round-5: no injected base — every live modal title carries a
      // different set (Quick Add: text-lg font-semibold …; full modals:
      // font-semibold leading-none tracking-tight …). Call sites own the
      // exact strings; this stays a pure Radix semantics wrapper.
      className={cn(className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

// Kept for API compatibility with existing imports; the overlay is now part
// of DialogContent (single-element live parity), so this component is unused.
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      {...props}
    />
  )
}
