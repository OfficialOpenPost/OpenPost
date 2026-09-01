"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, FileText, Image as ImageIcon, Tag, Folder, Users, Settings, PenLine, Webhook, Menu, X } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/blogs", label: "Blogs", icon: FileText },
  { href: "/dashboard/media", label: "Media", icon: ImageIcon },
  { href: "/dashboard/categories", label: "Categories", icon: Folder },
  { href: "/dashboard/tags", label: "Tags", icon: Tag },
  { href: "/dashboard/authors", label: "Authors", icon: Users },
  { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditor = pathname?.includes("/editor");
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isEditor) {
    return <div className="min-h-screen bg-surface">{children}</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F0F0F1] flex">
      <aside className="hidden md:flex w-80 shrink-0 flex-col border-r border-border bg-white fixed left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.02)]">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-[11px] font-bold tracking-widest text-text-tertiary uppercase">Menu</span>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-auto pb-4">
          {nav.map((item) => {
            const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-[#2D3440] text-white shadow-sm" : "text-text-secondary hover:bg-[#F0F0F1] hover:text-navy"}`}
              >
                <item.icon className={`h-4 w-4 ${isActive ? "text-[#FEA611]" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <Link href="/dashboard/editor" className="flex items-center justify-center gap-2 rounded-xl bg-[#FEA611] px-4 py-2.5 text-sm font-bold text-[#2D3440] hover:bg-[#FE990E] transition">
            <PenLine className="h-4 w-4" /> New Post
          </Link>
          <p className="mt-2 text-center text-[11px] text-text-tertiary">320px fixed · top nav pinned</p>
        </div>

      </aside>
      <div className="flex-1 min-w-0 flex flex-col md:ml-80">
        <header className="flex h-16 items-center justify-between border-b border-[#C3C4C7] bg-white px-4 sm:px-6 md:hidden shrink-0 sticky top-0 z-30">
          <button onClick={()=>setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white" aria-label="Open menu">
            <Menu className="h-4 w-4" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.svg" alt="OpenPost" className="h-8 w-8" />
            <span className="text-sm font-bold text-navy">
              Open<span className="text-brand">Post</span>
            </span>
          </Link>
          <Link href="/dashboard/editor" className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-navy">
            New Post
          </Link>
        </header>
        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={()=>setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white border-r border-border flex flex-col shadow-xl">
              <div className="flex h-16 items-center justify-between px-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <img src="/logo.svg" alt="OpenPost" className="h-7 w-7" />
                  <span className="text-sm font-bold text-navy">Open<span className="text-[#FEA611]">Post</span></span>
                </div>
                <button onClick={()=>setMobileOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-auto">
                {nav.map((item) => {
                  const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname === item.href || pathname?.startsWith(item.href + "/");
                  return (
                    <Link key={item.href} href={item.href} onClick={()=>setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? "bg-[#2D3440] text-white" : "text-text-secondary hover:bg-[#F0F0F1]"}`}>
                      <item.icon className={`h-4 w-4 ${isActive ? "text-[#FEA611]" : ""}`} />{item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}
        <div className="flex-1 bg-[#F0F0F1]">{children}</div>
      </div>
    </div>
  );
}
