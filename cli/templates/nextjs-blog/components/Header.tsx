"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Search, ArrowUpRight, Sparkles, Flame, Menu, X, Bell } from "lucide-react";
import { SearchModal } from "./SearchModal";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME || "My Blog";
const SITE_TAGLINE = process.env.NEXT_PUBLIC_SITE_TAGLINE || process.env.SITE_TAGLINE || "Stories, Ideas & Perspectives";
const SITE_LOGO_URL = process.env.NEXT_PUBLIC_SITE_LOGO_URL || process.env.SITE_LOGO_URL || "";
const OPENPOST_URL = process.env.NEXT_PUBLIC_OPENPOST_URL || process.env.OPENPOST_URL || "";

export function Header() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dateString, setDateString] = useState("");

  useEffect(() => {
    setDateString(
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    );
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/blog", label: "All Stories" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-all w-full">
        {/* Top Announcement / Ticker Bar — Expands smoothly across wider screens */}
        <div className="border-b border-slate-100 bg-slate-50/70 py-1.5 px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="mx-auto flex w-full max-w-[1600px] 2xl:max-w-[1780px] items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 font-semibold text-[#6C63FF]">
                <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                Featured:
              </span>
              <span className="hidden sm:inline font-medium text-slate-600 truncate max-w-xl">
                {SITE_TAGLINE}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400">
              <span className="hidden md:inline">
                {dateString}
              </span>
              {OPENPOST_URL && (
                <a
                  href={OPENPOST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-[#6C63FF] transition"
                >
                  <Sparkles className="h-3 w-3 text-[#6C63FF]" />
                  OpenPost Studio
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Main Navbar — Ultra-wide fluid layout */}
        <div className="mx-auto flex w-full max-w-[1600px] 2xl:max-w-[1780px] items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12 h-16 sm:h-20">
          {/* Brand Identity */}
          <Link href="/" className="group flex items-center gap-3">
            {SITE_LOGO_URL ? (
              <img src={SITE_LOGO_URL} alt={SITE_NAME} className="h-9 w-auto rounded-xl object-contain shadow-2xs" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6C63FF] via-[#5B52E5] to-[#4F46E5] text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 font-display group-hover:text-[#6C63FF] transition-colors leading-tight">
                {SITE_NAME}
              </span>
              <span className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Editorial Publication
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-bold text-slate-600">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-slate-50/80 px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:border-slate-300 hover:bg-white hover:text-slate-900 shadow-2xs transition"
              title="Search articles (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline rounded bg-white px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 border border-slate-200">
                ⌘K
              </kbd>
            </button>

            {/* Subscribe Action Button */}
            <Link
              href="/feed.xml"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#6C63FF] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-500/25 hover:bg-[#5B52E5] hover:shadow-md transition"
            >
              <Bell className="h-3.5 w-3.5" />
              Subscribe
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-5 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl text-sm font-bold ${
                    pathname === link.href ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/feed.xml"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#6C63FF] px-4 py-2 text-xs font-bold text-white"
              >
                <Bell className="h-3.5 w-3.5" /> Subscribe via RSS
              </Link>
              {OPENPOST_URL && (
                <a
                  href={OPENPOST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  CMS Studio <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Search Dialog Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
