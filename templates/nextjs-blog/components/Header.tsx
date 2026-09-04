"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Search, ArrowUpRight, Menu, X, Sparkles } from "lucide-react";
import { SearchModal } from "./SearchModal";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME || "OpenPost";
const SITE_TAGLINE = process.env.NEXT_PUBLIC_SITE_TAGLINE || process.env.SITE_TAGLINE || "Stories, Ideas & Perspectives";
const SITE_LOGO_URL = process.env.NEXT_PUBLIC_SITE_LOGO_URL || process.env.SITE_LOGO_URL || "";
const OPENPOST_URL = process.env.NEXT_PUBLIC_OPENPOST_URL || process.env.OPENPOST_URL || "";

export function Header() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md transition-all w-full">
        <div className="mx-auto flex w-full max-w-[1520px] 2xl:max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
          {/* Brand Identity */}
          <Link href="/" className="group flex items-center gap-2.5">
            {SITE_LOGO_URL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={SITE_LOGO_URL} alt={SITE_NAME} className="h-8 w-auto rounded-lg object-contain" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-black shadow-xs group-hover:bg-blue-700 transition">
                <span className="text-xs">OP</span>
              </div>
            )}
            <span className="text-lg font-black tracking-tight text-slate-900 font-display">
              {SITE_NAME}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition hover:text-blue-600 ${
                    isActive ? "text-blue-600 font-bold" : "text-slate-600"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-3">
            {/* Quick Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:border-slate-300 hover:bg-white hover:text-slate-900 transition shadow-2xs"
              title="Search articles (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Search...</span>
            </button>

            {OPENPOST_URL && (
              <a
                href={OPENPOST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 px-3 py-1.5 transition"
              >
                Studio <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}

            {/* Subscribe Blue Pill Button (Zentra Style) */}
            <Link
              href="/feed.xml"
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 shadow-xs transition active:scale-95 flex items-center gap-1.5"
            >
              <span>Get Started</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-5 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl text-sm font-bold ${
                    pathname === link.href ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/feed.xml"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full bg-blue-600 text-white px-4 py-2 text-xs font-bold"
              >
                Get Started
              </Link>
              {OPENPOST_URL && (
                <a
                  href={OPENPOST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1"
                >
                  CMS Studio <ArrowUpRight className="h-3.5 w-3.5" />
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
