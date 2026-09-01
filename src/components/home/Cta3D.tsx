"use client";

import Link from "next/link";
import { ArrowRight, Shield, Zap, Heart } from "lucide-react";
import { FadeIn } from "@/components/motion";

export function Cta3D() {
  return (
    <section className="bg-gradient-to-b from-white via-[#FEFBF6] to-[#FFF8EB] py-20 sm:py-28 border-b border-border text-center">
      <div className="mx-auto max-w-4xl px-6">
        <FadeIn>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-xs font-bold text-navy">
            <span className="flex h-2 w-2 relative">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            <span>Get Started in Under 2 Minutes</span>
          </div>

          <h2 className="mt-6 text-3xl sm:text-5xl font-extrabold text-navy tracking-tight leading-tight">
            Ready to write something
            <br />
            <span className="gradient-text-brand">truly remarkable?</span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-text-secondary leading-relaxed">
            Join thousands of writers, creators, and engineering teams who publish with OpenPost.
            Free &amp; open source under the MIT License.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-navy px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-navy/15 hover:bg-navy-dark hover:scale-[1.02] transition"
            >
              Start Writing Free
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="https://github.com/OfficialOpenPost/OpenPost.git"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-7 py-3.5 text-sm font-bold text-navy hover:bg-surface-dim hover:border-brand/40 transition shadow-xs"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-text-tertiary">
            <span className="flex items-center gap-1.5 font-medium text-text-secondary">
              <Shield className="h-3.5 w-3.5 text-emerald-600" /> MIT Open Source License
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-medium text-text-secondary">
              <Zap className="h-3.5 w-3.5 text-brand" /> Sub-50ms Global Edge API
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-medium text-text-secondary">
              <Heart className="h-3.5 w-3.5 text-[#FE4F01]" /> 100% Free Forever
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
