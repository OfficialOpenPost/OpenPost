"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Mail, Lock, Sparkles, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authState, setAuthState] = useState<"idle" | "authenticating" | "redirecting">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authState !== "idle") return;
    setAuthState("authenticating");
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase not configured");

      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      setAuthState("redirecting");
      // Use router.push and fallback to window.location if taking longer
      router.push("/dashboard");
      router.refresh();
      setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname !== "/dashboard") {
          window.location.href = "/dashboard";
        }
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid email or password";
      setError(message);
      setAuthState("idle");
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left — branding panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-[52%] bg-navy relative overflow-hidden flex-col justify-between p-12"
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(254,166,17,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(254,166,17,0.08) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute top-20 right-20 h-64 w-64 rounded-full bg-brand/10 blur-[100px]" />
        <div className="absolute bottom-20 left-20 h-48 w-48 rounded-full bg-flame/10 blur-[80px]" />

        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="OpenPost" className="h-10 w-10" />
            <span className="text-xl font-bold tracking-tight text-white">
              Open<span className="text-brand">Post</span>
            </span>
          </Link>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1">
            <Sparkles className="h-3 w-3 text-brand" />
            <span className="text-xs font-semibold text-brand">Trusted by 2,400+ teams</span>
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-white">
            Write content
            <br />
            <span className="text-brand">that matters.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            The professional blog CMS that gives you the writing experience of Google Docs with the power of a headless API.
          </p>

          <div className="mt-10 rounded-2xl border border-slate-700/40 bg-slate-800/40 p-5 backdrop-blur">
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-3.5 w-3.5 fill-brand text-brand" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              ))}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              “OpenPost cut our publishing time in half. The editor is buttery smooth and the API just works.”
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand to-orange" />
              <div>
                <p className="text-xs font-semibold text-white">Sarah Chen</p>
                <p className="text-[11px] text-slate-500">Content Lead, Vercel</p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-slate-600">© {new Date().getFullYear()} OpenPost — MIT Licensed</p>
      </motion.div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface-raised lg:bg-surface">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <img src="/logo.svg" alt="OpenPost" className="h-9 w-9" />
            <span className="text-lg font-bold tracking-tight text-navy">
              Open<span className="text-brand">Post</span>
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-8 shadow-xl shadow-navy/5">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">Welcome back</h2>
            {process.env.NEXT_PUBLIC_ALLOW_SIGNUP === "true" && (
              <p className="mt-2 text-sm text-text-secondary">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-semibold text-brand hover:text-flame transition">
                  Sign up
                </Link>
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">Password</label>
                  <Link href="#" className="text-xs font-medium text-brand hover:text-flame transition">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-11 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-border text-brand focus:ring-brand/20" />
                <span className="text-sm text-text-secondary">Remember me for 30 days</span>
              </label>

              {error && <p className="rounded-xl bg-flame/10 border border-flame/20 px-3 py-2 text-sm text-flame">{error}</p>}

              <button
                type="submit"
                disabled={authState !== "idle"}
                className={`relative overflow-hidden group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-md transition-all duration-300 ${
                  authState === "redirecting"
                    ? "bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-400/40"
                    : authState === "authenticating"
                    ? "bg-brand text-navy opacity-95 shadow-brand/30 cursor-wait"
                    : "bg-brand text-navy shadow-brand/20 hover:bg-brand-hover hover:shadow-brand/30 active:scale-[0.99]"
                }`}
              >
                {/* Subtle animated shimmer effect */}
                {authState !== "idle" && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  />
                )}

                {authState === "authenticating" && (
                  <span className="relative flex items-center gap-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-navy" />
                    <span>Verifying credentials...</span>
                  </span>
                )}

                {authState === "redirecting" && (
                  <span className="relative flex items-center gap-2.5">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20"
                    >
                      <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                    </motion.span>
                    <span>Success! Redirecting to dashboard...</span>
                  </span>
                )}

                {authState === "idle" && (
                  <span className="relative flex items-center gap-2">
                    Sign in <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                )}
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <span className="relative bg-surface px-3 text-xs text-text-tertiary">Or continue with</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Google", icon: "G" },
                  { label: "GitHub", icon: "◈" },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="h-11 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary hover:bg-surface-raised transition"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-overlay text-xs">{p.icon}</span>
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </form>


          </div>

          <p className="mt-6 text-center text-xs text-text-tertiary">
            By signing in you agree to our <Link href="/terms" className="underline hover:text-text-primary">Terms</Link> and{" "}
            <Link href="/privacy" className="underline hover:text-text-primary">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
