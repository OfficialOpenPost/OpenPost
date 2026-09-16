"use client";

import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Writing Studio", href: "/#interactive-editor" },
    { label: "Headless API", href: "/#api" },
    { label: "Content Blocks", href: "/#blocks" },
    { label: "SEO Engine", href: "/#seo" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Changelog", href: "/changelog" },
  ],
  Infrastructure: [
    { label: "Deployment Guide", href: "/docs/deployment" },
    { label: "Vercel Template", href: "/docs/deployment" },
    { label: "Supabase & Postgres", href: "/docs/supabase-setup" },
    { label: "Cloudflare R2", href: "/docs/cloudflare-setup" },
    { label: "Docker Self-Host", href: "/docs/deployment" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Public Blog", href: "/blog" },
    { label: "Authors", href: "/authors" },
    { label: "GitHub Repository", href: "https://github.com/OfficialOpenPost/OpenPost" },
    { label: "Roadmap", href: "/roadmap" },
    { label: "CLI (openpost-cli)", href: "/docs/cli" },
  ],
  Company: [
    { label: "About OpenPost", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Security", href: "/security" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#F9FAFB] text-navy">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand — spans 2 cols on desktop */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <img src="/logo.svg" alt="OpenPost" className="h-8 w-8 object-contain transition-transform group-hover:scale-105" />
              <span className="text-lg font-extrabold tracking-tight text-navy">
                Open<span className="text-brand">Post</span>
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
              Professional blog CMS and writing studio. Write with block-based ergonomics,
              optimize with automated SEO and WebP pipelines, and deliver content globally
              in sub-50ms — self-hosted, MIT-licensed, your data stays yours.
            </p>
            <p className="mt-3 text-sm">
              <a href="mailto:officialopenpost@outlook.com" className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                officialopenpost@outlook.com
              </a>
              <span className="text-text-tertiary"> — reach us anytime</span>
            </p>

            {/* Social logos */}
            <div className="mt-5 flex items-center gap-2.5">
              <a
                href="https://github.com/OfficialOpenPost/OpenPost"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-secondary shadow-xs transition hover:border-brand/30 hover:text-navy hover:shadow-sm hover:-translate-y-0.5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="mailto:officialopenpost@outlook.com"
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-secondary shadow-xs transition hover:border-brand/30 hover:text-navy hover:shadow-sm hover:-translate-y-0.5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X (Twitter)"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-secondary shadow-xs transition hover:border-brand/30 hover:text-navy hover:shadow-sm hover:-translate-y-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="/docs"
                aria-label="Docs"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-secondary shadow-xs transition hover:border-brand/30 hover:text-navy hover:shadow-sm hover:-translate-y-0.5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns — 4 cols */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="min-w-0">
              <h4 className="text-sm font-bold uppercase tracking-wider text-navy">{title}</h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => {
                  const isExternal = link.href.startsWith("http") || link.href.startsWith("mailto:");
                  return (
                    <li key={`${title}-${link.label}`}>
                      <Link
                        href={link.href as any}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noreferrer" : undefined}
                        className="inline-flex items-center gap-1 text-sm leading-none text-text-secondary transition hover:text-navy hover:underline underline-offset-4"
                      >
                        {link.label}
                        {isExternal && link.href.startsWith("http") && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-tertiary">
            <span>&copy; {new Date().getFullYear()} OpenPost. Free &amp; Open Source under MIT License.</span>
            <span className="hidden sm:inline text-border">|</span>
            <a href="mailto:officialopenpost@outlook.com" className="font-medium text-text-secondary hover:text-navy hover:underline">
              officialopenpost@outlook.com
            </a>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              All systems operational
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-text-tertiary">
              <span>Built with</span>
              <span className="text-brand">♥</span>
              <span>for writers</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
