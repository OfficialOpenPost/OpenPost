"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight } from "lucide-react";

const navLinks = [
  { label: "Studio", href: "/#interactive-editor" },
  { label: "API & Cloud", href: "/#api" },
  { label: "Features", href: "/#blocks" },
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }: any) => setIsLoggedIn(!!session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e: any, session: any) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-border p-1 shadow-xs transition group-hover:scale-105">
            <img src="/logo.svg" alt="OpenPost" className="h-full w-full object-contain" />
          </div>
          <span className="text-lg font-bold tracking-tight text-navy">
            Open<span className="text-brand">Post</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-semibold text-text-secondary transition hover:text-navy"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-2.5 md:flex">
          <a
            href="https://github.com/OfficialOpenPost/OpenPost.git"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-navy hover:bg-surface-dim transition shadow-xs"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span>GitHub</span>
          </a>

          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-navy-dark transition"
              >
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase?.auth.signOut();
                  setIsLoggedIn(false);
                  window.location.href = "/";
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-navy transition"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-navy transition"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-navy-dark transition"
              >
                Start Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-navy md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-2.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-semibold text-navy"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-border my-1" />
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-navy px-3 py-2 text-center text-xs font-bold text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase?.auth.signOut();
                    setMobileOpen(false);
                    window.location.href = "/";
                  }}
                  className="text-left text-xs font-semibold text-text-secondary"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-semibold text-text-secondary"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-navy px-3 py-2 text-center text-xs font-bold text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Start Writing Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
