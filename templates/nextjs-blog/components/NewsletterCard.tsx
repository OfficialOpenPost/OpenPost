"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export function NewsletterCard() {
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
    <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-gradient-to-r from-[#1E5BF8] via-[#2563EB] to-[#3B82F6] p-6 sm:p-12 lg:p-14 text-white shadow-2xl border border-white/20">
      {/* Decorative Right-side Arch Shapes (Matching the Zentra reference design) */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none hidden md:block overflow-hidden">
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-64 h-80 rounded-t-full border-[20px] border-white/10" />
        <div className="absolute right-24 top-1/2 -translate-y-1/2 w-48 h-64 rounded-t-full bg-white/5" />
      </div>

      <div className="relative z-10 max-w-xl text-left space-y-3.5 sm:space-y-4">
        <h2 className="text-xl sm:text-4xl lg:text-[42px] font-black text-white tracking-tight leading-tight font-display">
          Subscribe to our<br className="hidden sm:inline" /> newsletter
        </h2>
        <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-normal max-w-lg">
          Stay in the loop with the freshest updates on our innovative products, exciting promotions, and insightful articles that cater to your interests!
        </p>

        {submitted ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-white border border-white/30 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
            <span>Thank you for subscribing! Check your inbox soon.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-1 sm:pt-2 space-y-2.5 max-w-md">
            <div className="flex items-center bg-white/15 backdrop-blur-md p-1 sm:p-1.5 rounded-full border border-white/25 shadow-inner gap-1 sm:gap-2">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3.5 sm:px-4 py-2 text-xs sm:text-sm text-white placeholder:text-blue-100 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-white text-[#1E5BF8] hover:bg-blue-50 px-4 sm:px-7 py-2 sm:py-2.5 text-xs sm:text-sm font-black transition shadow-md shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1E5BF8]" /> : null}
                <span>Subscribe</span>
              </button>
            </div>
            <p className="text-[10px] sm:text-[11px] text-blue-200/90 leading-tight">
              By clicking submit I agree to receive the latest news and updates.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
