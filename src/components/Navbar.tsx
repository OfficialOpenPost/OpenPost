"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Docs", href: "/docs" },
  { label: "GitHub", href: "https://github.com/OfficialOpenPost/OpenPost.git" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }: any) => setIsLoggedIn(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: any, session: any) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.svg"
            alt="OpenPost"
            className="h-9 w-9 transition group-hover:scale-105"
          />
          <span className="text-lg font-bold tracking-tight text-dark">
            Open<span className="text-primary">Post</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-secondary transition hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-navy hover:bg-brand-hover transition">
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase?.auth.signOut();
                  setIsLoggedIn(false);
                  window.location.href = "/";
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition hover:text-text-primary">
                Sign in
              </Link>
              <Link href="/signup" className="rounded-lg bg-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-dark-light">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition hover:bg-surface-overlay md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-surface px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-text-secondary transition hover:text-text-primary"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-border" />
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-bold text-navy" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase?.auth.signOut();
                    setMobileOpen(false);
                    window.location.href = "/";
                  }}
                  className="text-left text-sm font-medium text-text-secondary"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-text-secondary" onClick={() => setMobileOpen(false)}>
                  Sign in
                </Link>
                <Link href="/signup" className="rounded-lg bg-dark px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-dark-light" onClick={() => setMobileOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
