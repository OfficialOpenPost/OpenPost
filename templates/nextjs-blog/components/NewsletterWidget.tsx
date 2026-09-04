"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

export function NewsletterWidget() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900 font-display">Subscribe</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Get the latest design strategies, articles, and perspectives delivered to your inbox.
        </p>
      </div>

      {submitted ? (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200/60 p-4 flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Thank you for subscribing!</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="email"
              required
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none transition shadow-2xs"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#E56868] hover:bg-[#d95555] text-white py-2.5 text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.99]"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>Submit</span>
          </button>
        </form>
      )}
    </div>
  );
}
