"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Rocket,
  Database,
  Terminal,
  Webhook,
  Shield,
  Server,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  PenTool,
} from "lucide-react";
import { DocsSearchTrigger } from "./DocsSearch";

export interface NavSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: { title: string; href: string; badge?: string }[];
}

export const DOCS_NAVIGATION: NavSection[] = [
  {
    title: "Getting Started",
    icon: Rocket,
    items: [
      { title: "Overview & Architecture", href: "/docs/getting-started/overview" },
      { title: "5-Minute Quickstart", href: "/docs/getting-started/quickstart", badge: "Fast" },
      { title: "Environment Variables", href: "/docs/getting-started/environment-variables" },
    ],
  },
  {
    title: "Database & Storage",
    icon: Database,
    items: [
      { title: "Supabase & Postgres Setup", href: "/docs/supabase-setup", badge: "SQL" },
      { title: "Cloudflare R2 Media", href: "/docs/cloudflare-setup" },
      { title: "Media & Storage System", href: "/docs/media-storage" },
    ],
  },
  {
    title: "Writing Studio & Editor",
    icon: PenTool,
    items: [
      { title: "Editor & 16 Slash Blocks", href: "/docs/editor", badge: "Tiptap" },
      { title: "Editor Custom Blocks", href: "/docs/editor-blocks" },
      { title: "Editor Extensions", href: "/docs/editor-extensions" },
    ],
  },
  {
    title: "Headless REST API",
    icon: Terminal,
    items: [
      { title: "API Overview & Auth", href: "/docs/api/overview" },
      { title: "Posts & Revisions API", href: "/docs/api/posts", badge: "REST" },
      { title: "Categories & Tags API", href: "/docs/api/taxonomies" },
      { title: "Authors API", href: "/docs/api/authors" },
      { title: "Polls & Voting API", href: "/docs/api/polls" },
      { title: "Media & Presign API", href: "/docs/api/media" },
      { title: "Cron & Health API", href: "/docs/api/cron-health" },
      { title: "API Examples & Recipes", href: "/docs/api-examples" },
    ],
  },
  {
    title: "Automation & CLI",
    icon: Webhook,
    items: [
      { title: "Webhooks Engine", href: "/docs/webhooks", badge: "HMAC" },
      { title: "Webhooks API Reference", href: "/docs/webhooks-api" },
      { title: "OpenPost CLI (openpost-cli)", href: "/docs/cli", badge: "CLI" },
      { title: "Frontend Integration (Next.js)", href: "/docs/frontend" },
      { title: "Frontend Editing Integration", href: "/docs/frontend-editing" },
    ],
  },
  {
    title: "Multi-Tenancy & Security",
    icon: Shield,
    items: [
      { title: "Projects & Workspaces", href: "/docs/projects" },
      { title: "Security & RBAC Matrix", href: "/docs/security" },
      { title: "RBAC Permissions Detail", href: "/docs/rbac" },
      { title: "Authentication & Sessions", href: "/docs/authentication" },
    ],
  },
  {
    title: "Deep Dive",
    icon: BookOpen,
    items: [
      { title: "System Architecture", href: "/docs/architecture" },
      { title: "Database Schema", href: "/docs/database" },
      { title: "Content Format (JSON AST)", href: "/docs/content-format" },
      { title: "SEO & Social Sharing", href: "/docs/seo" },
      { title: "Environment Variables", href: "/docs/environment" },
    ],
  },
  {
    title: "Operations & Ops",
    icon: Server,
    items: [
      { title: "Deployment & Self-Hosting", href: "/docs/deployment", badge: "Docker" },
      { title: "Troubleshooting Guide", href: "/docs/troubleshooting" },
      { title: "Contributing Guide", href: "/docs/contributing" },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Getting Started": true,
    "Database & Storage": true,
    "Writing Studio & Editor": true,
    "Headless REST API": true,
    "Automation & CLI": true,
    "Multi-Tenancy & Security": true,
    "Deep Dive": true,
    "Operations & Ops": true,
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const NavItems = (
    <div className="space-y-4 py-2">
      <div className="px-1 mb-2">
        <DocsSearchTrigger />
      </div>

      <nav className="space-y-3.5">
        {DOCS_NAVIGATION.map((section) => {
          const isOpen = openSections[section.title] !== false;
          const Icon = section.icon;

          return (
            <div key={section.title} className="space-y-1">
              <button
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-text-tertiary hover:text-navy transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-brand" />
                  <span>{section.title}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-text-tertiary/60 group-hover:text-navy transition-transform" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-text-tertiary/60 group-hover:text-navy transition-transform" />
                )}
              </button>

              {isOpen && (
                <div className="ml-2.5 border-l border-border pl-2 space-y-0.5 pt-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== "/docs");

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                          isActive
                            ? "bg-brand/10 text-brand font-bold shadow-2xs border border-brand/20"
                            : "text-text-secondary hover:bg-surface-raised hover:text-navy"
                        }`}
                      >
                        <span className="truncate">{item.title}</span>
                        {item.badge && (
                          <span
                            className={`ml-1.5 rounded px-1.5 py-0.2 text-[9px] font-mono font-semibold uppercase tracking-wider ${
                              isActive
                                ? "bg-brand text-navy"
                                : "bg-surface-raised text-text-tertiary group-hover:bg-border group-hover:text-navy"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navigation Sub-Bar for Docs */}
      <div className="lg:hidden w-full flex items-center justify-between bg-white border-b border-border px-4 py-3 sticky top-16 z-30 mb-6 shadow-2xs">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-navy hover:bg-surface-raised transition-colors"
        >
          <Menu className="h-4 w-4 text-brand" />
          <span>Documentation Menu</span>
        </button>
        <div className="w-40 sm:w-56">
          <DocsSearchTrigger />
        </div>
      </div>

      {/* Mobile Slide Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-navy/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setMobileOpen(false)} />
          <div className="relative w-80 max-w-[85vw] bg-white h-full p-5 overflow-y-auto shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
              <div className="flex items-center gap-2 font-bold text-navy text-sm">
                <BookOpen className="h-4 w-4 text-brand" />
                <span>OpenPost Docs</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-md text-text-tertiary hover:text-navy hover:bg-surface-raised"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {NavItems}
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar (Cloudflare & Supabase style) */}
      <aside className="hidden lg:block w-64 xl:w-72 2xl:w-80 shrink-0 sticky top-16 h-[calc(100vh-4rem)] border-r border-border bg-[#FCFCF9]/60 overflow-y-auto pl-4 sm:pl-6 pr-4 py-5 z-20">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
          <div className="flex items-center gap-2 text-navy font-bold text-sm">
            <BookOpen className="h-4 w-4 text-brand" />
            <span>OpenPost Docs</span>
          </div>
          <span className="rounded-full bg-brand/10 border border-brand/20 px-2 py-0.5 text-[10px] font-bold text-brand">
            v1.0
          </span>
        </div>
        {NavItems}
      </aside>
    </>
  );
}
