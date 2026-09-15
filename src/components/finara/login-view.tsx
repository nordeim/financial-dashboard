"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Lock, Mail, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Demo login gate mirroring the Finara sign-in screen.
 * This is a demo credential check, not production authentication —
 * see README (Authentication) before deploying anywhere real.
 */

export const DEMO_EMAIL = "sepnetflix2023@outlook.com";
export const DEMO_PASSWORD = "Abcd1234";

export function LoginView({ onSignIn }: { onSignIn: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        setError("Invalid email or password. Use the demo credentials shown below.");
        setSubmitting(false);
      }
    }, 450);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-800 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg">
            <Wallet className="h-7 w-7 text-white" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome to Finara</h1>
          <p className="text-sm text-slate-400">Sign in to continue</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() =>
              toast({
                title: "Google sign-in unavailable",
                description: "This demo build authenticates with the demo credentials instead.",
              })
            }
          >
            <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden>
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
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">OR</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9 pr-10"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                  </button>
                </div>
              </div>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600" role="alert">
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() =>
                    toast({
                      title: "Password reset",
                      description: "Password recovery is not part of this demo build.",
                    })
                  }
                  className="font-medium text-slate-500 transition-colors hover:text-slate-700"
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
                  className="font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                >
                  Need an account? Sign up
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold text-emerald-800">Demo credentials</p>
            <p className="mt-1 text-xs text-emerald-700">
              Email: <span className="font-mono">{DEMO_EMAIL}</span>
              <br />
              Password: <span className="font-mono">{DEMO_PASSWORD}</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
