"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Sparkles, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ALLOW_PUBLIC_SIGNUP = process.env.NEXT_PUBLIC_ALLOW_SIGNUP === "true";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [signupState, setSignupState] = useState<"idle" | "creating" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", agree: false });

  if (!ALLOW_PUBLIC_SIGNUP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-navy">Signups are private</h1>
          <p className="mt-2 text-sm text-text-secondary">OpenPost is private — contact your administrator for an invite. Admins can invite via Dashboard → Users.</p>
          <a href="/login" className="mt-6 inline-flex rounded-xl bg-brand px-6 py-3 text-sm font-bold text-navy">
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agree || signupState !== "idle") return;
    setSignupState("creating");
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase not configured");

      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name } },
      });
      if (signUpError) throw signUpError;

      setSignupState("success");
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create account";
      setError(message);
      setSignupState("idle");
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface-raised lg:bg-surface">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px]"
        >
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <img src="/logo.svg" alt="OpenPost" className="h-9 w-9" />
            <span className="text-lg font-bold tracking-tight text-navy">
              Open<span className="text-brand">Post</span>
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-8 shadow-xl shadow-navy/5">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">Create your account</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-brand hover:text-flame transition">
                Sign in
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Full name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Doe"
                    required
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
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
                <p className="text-xs text-text-tertiary">Must be at least 8 characters with a mix of letters and numbers.</p>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => setForm({ ...form, agree: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border text-brand focus:ring-brand/20"
                  required
                />
                <span className="text-sm leading-relaxed text-text-secondary">
                  I agree to the{" "}
                  <Link href="/terms" className="font-medium text-text-primary underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-medium text-text-primary underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              {error && <p className="rounded-xl bg-flame/10 border border-flame/20 px-3 py-2 text-sm text-flame">{error}</p>}

              <button
                type="submit"
                disabled={signupState !== "idle" || !form.agree}
                className={`relative overflow-hidden group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-md transition-all duration-300 ${
                  signupState === "success"
                    ? "bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-400/40"
                    : signupState === "creating"
                    ? "bg-brand text-navy opacity-95 shadow-brand/30 cursor-wait"
                    : "bg-brand text-navy shadow-brand/20 hover:bg-brand-hover hover:shadow-brand/30 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {/* Subtle animated shimmer effect */}
                {signupState !== "idle" && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  />
                )}

                {signupState === "creating" && (
                  <span className="relative flex items-center gap-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-navy" />
                    <span>Creating your workspace...</span>
                  </span>
                )}

                {signupState === "success" && (
                  <span className="relative flex items-center gap-2.5">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20"
                    >
                      <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                    </motion.span>
                    <span>Account created! Redirecting to login...</span>
                  </span>
                )}

                {signupState === "idle" && (
                  <span className="relative flex items-center gap-2">
                    Create account <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
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
        </motion.div>
      </div>

      {/* Right — branding panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
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
          <h2 className="text-3xl font-bold leading-tight text-white">
            Start publishing
            <br />
            <span className="text-brand">in minutes.</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Free and open source. Deploy on Vercel + Supabase + Cloudflare, or self-host with Docker. No vendor lock-in.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "Block-based editor with 16+ content types",
              "SEO panel with actionable warnings",
              "Headless API — build any frontend",
              "Autosave that never loses your work",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-brand">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm text-slate-300">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-3 rounded-xl border border-slate-700/40 bg-slate-800/40 px-4 py-3">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-7 w-7 rounded-full border-2 border-navy bg-gradient-to-br from-brand to-orange" />
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Join <span className="font-semibold text-white">2,400+</span> happy writers
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-slate-600">
          <Sparkles className="h-3 w-3 text-brand" /> MIT Licensed · Deploy in under 5 minutes
        </div>
      </motion.div>
    </div>
  );
}
