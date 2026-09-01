"use client";

import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Writing Studio", href: "/#interactive-editor" },
    { label: "Headless API", href: "/#api" },
    { label: "Content Blocks", href: "/#blocks" },
    { label: "Command Center", href: "/#dashboard" },
    { label: "SEO Engine", href: "/#seo" },
    { label: "Changelog", href: "/changelog" },
  ],
  Infrastructure: [
    { label: "Deployment Guide", href: "/#deploy" },
    { label: "Vercel Template", href: "/docs" },
    { label: "Supabase & Postgres", href: "/docs" },
    { label: "Cloudflare R2", href: "/docs" },
    { label: "Docker Self-Host", href: "/docs" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Public Blog", href: "/blog" },
    { label: "GitHub Repository", href: "https://github.com/OfficialOpenPost/OpenPost.git" },
    { label: "Roadmap", href: "/roadmap" },
    { label: "CLI Reference", href: "/cli" },
  ],
  Company: [
    { label: "About OpenPost", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#F9FAFB] text-navy">
      <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-5">
          {/* Brand Info */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-border p-1 shadow-xs">
                <img src="/logo.svg" alt="OpenPost" className="h-full w-full object-contain" />
              </div>
              <span className="text-lg font-bold tracking-tight text-navy">
                Open<span className="text-brand">Post</span>
              </span>
            </Link>

            <p className="mt-3 max-w-sm text-xs leading-relaxed text-text-secondary">
              Professional blog CMS and writing studio. Write with block-based ergonomics,
              optimize with automated SEO and WebP pipelines, and deliver content globally in sub-50ms.
            </p>

            <div className="mt-4 flex items-center gap-2.5">
              <a
                href="https://github.com/OfficialOpenPost/OpenPost.git"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-text-secondary hover:text-navy hover:border-brand/40 transition shadow-xs"
                aria-label="GitHub"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).slice(0, 3).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy">{title}</h4>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={`${title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-xs text-text-secondary transition hover:text-navy hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row text-xs text-text-tertiary">
          <p>
            &copy; {new Date().getFullYear()} OpenPost. Free &amp; Open Source under MIT License.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-emerald-700 font-semibold">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
