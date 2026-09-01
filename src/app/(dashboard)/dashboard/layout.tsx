"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Image as ImageIcon, Tag, Folder, Users, Settings, PenLine, Webhook } from "lucide-react";

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

  if (isEditor) {
    return <div className="min-h-screen bg-surface">{children}</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F0F0F1] flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[#C3C4C7] bg-white shadow-sm fixed left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto z-20">
        <div className="flex h-10 items-center px-6 mt-2">
          <span className="text-xs font-bold tracking-widest text-text-tertiary uppercase">Menu</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-auto">
          {nav.map((item) => {
            const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-navy text-white" : "text-text-secondary hover:bg-[#F0F0F1] hover:text-navy"}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

      </aside>
      <div className="flex-1 min-w-0 flex flex-col md:ml-64">
        <header className="flex h-16 items-center justify-between border-b border-[#C3C4C7] bg-white px-6 md:hidden shrink-0">
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
        <div className="flex-1 bg-[#F0F0F1]">{children}</div>
      </div>
    </div>
  );
}
