"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Login gate mirroring the Finara sign-in screen (live-exact anatomy,
 * round-6 capture 2026-09-17): light gradient canvas, glass card with a
 * gradient top strip, ringed span-wrapped logo, RAW Google button (not the
 * shadcn Button base), custom py-2 inputs with ring-2 focus, slate-900
 * submit. Pinned by src/lib/__tests__/login-view.test.tsx.
 * This is a demo credential check, not production authentication —
 * see README (Authentication) before deploying anywhere real.
 */

// Round 9: the identity lives in lib/demo-user (the GDPR export embeds it
// too); re-exported here so existing imports keep working.
export { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-user";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-user";

/** Live login input classes (round-6 capture): py-2, ring-2 + ring-offset,
 * no shadow-sm/transition-colors — a custom set, NOT the app-wide Input. */
const LOGIN_INPUT_CLASSES =
  "flex w-full border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-600";

export function LoginView({ onSignIn }: { onSignIn: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setSubmitting(true);
    // Deliberate demo gate: validates against the documented demo account.
    window.setTimeout(() => {
      if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
        onSignIn(email.trim());
      } else {
        setError("Invalid email or password");
        setSubmitting(false);
      }
    }, 450);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl border-0 bg-white/95 text-card-foreground shadow-2xl backdrop-blur-sm">
          {/* Live-exact gradient top strip (left-0 right-0 spelling). */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" aria-hidden />
          <div className="p-8 sm:p-10 md:pb-10 md:pt-12 md:px-10">
            <div className="flex flex-col items-center space-y-6 text-center sm:space-y-8">
              <div className="group relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 opacity-30 blur-xl transition-opacity duration-300 group-hover:opacity-40" aria-hidden />
                {/* Live logo anatomy: the ring/shadow/transition live on a span
                    wrapper; the img is a plain aspect-square fill. */}
                <span className="flex shrink-0 overflow-hidden rounded-full relative h-20 w-20 sm:h-24 sm:w-24 shadow-lg ring-4 ring-white/50 group-hover:shadow-xl transition-all duration-300">
                  <img src="/finara-logo.png" alt="Finara logo" className="aspect-square h-full w-full object-cover" />
                </span>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome to Finara</h1>
                <p className="text-sm font-medium text-slate-500 sm:text-base">Sign in to continue</p>
              </div>
              <div className="w-full">
                <div className="space-y-3">
                  {/* Live renders a RAW button here (not the shadcn Button
                      base) with the icon wrapped in a -ml-4 div. */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 font-medium text-[16px] group"
                    onClick={() =>
                      toast({
                        title: "Google sign-in unavailable",
                        description: "This demo build authenticates with the demo credentials instead.",
                      })
                    }
                  >
                    <div className=" transition-transform duration-200 -ml-4">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    </div>
                    Continue with Google
                  </button>
                </div>
                {/* Live-exact divider: shrink-0 h-[1px] line + "or" chip. */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center" aria-hidden>
                    <div className="shrink-0 h-[1px] w-full bg-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 font-medium tracking-wider text-slate-500">or</span>
                  </div>
                </div>
                {/* Live carries the spacing classes on the form itself. */}
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden />
                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          className={LOGIN_INPUT_CLASSES}
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden />
                        <input
                          id="password"
                          type="password"
                          autoComplete="current-password"
                          placeholder="••••••••"
                          className={LOGIN_INPUT_CLASSES}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  {error ? (
                    <Alert className="rounded-xl border-red-200 bg-red-50/70">
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  ) : null}
                  <div className="space-y-3">
                    {/* Live submit base: gap-1, px-3 py-2, ring-2 + offset. */}
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 px-3 py-2 w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm rounded-xl transition-all duration-200"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden /> Signing in…
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </button>
                    <div className="flex flex-col items-center justify-between gap-2 sm:flex-row sm:gap-0">
                      <button
                        type="button"
                        onClick={() =>
                          toast({
                            title: "Password reset",
                            description: "Password recovery is not part of this demo build.",
                          })
                        }
                        className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                      >
                        Forgot password?
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          toast({
                            title: "Sign-up unavailable",
                            description: "This demo uses a single pre-provisioned demo account.",
                          })
                        }
                        className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        Need an account? <span className="font-medium text-slate-700">Sign up</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Demo affordance (clone-only, subdued to blend with the source design). */}
                <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-600">Demo credentials</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Email: <span className="font-mono">{DEMO_EMAIL}</span>
                    <br />
                    Password: <span className="font-mono">{DEMO_PASSWORD}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Live renders a mobile-only spacer under the card. */}
        <div className="mt-8 text-center text-xs text-slate-400 sm:hidden">
          <p>&nbsp;</p>
        </div>
      </div>
    </main>
  );
}
