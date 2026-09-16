"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  Tag,
  Folder,
  Users,
  Settings,
  PenLine,
  Webhook,
  Menu,
  X,
  ExternalLink,
  Shield,
  Plus,
  Check,
  Loader2,
} from "lucide-react";
import { ProjectSwitcher } from "@/components/project/ProjectSwitcher";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/blogs", label: "Articles & Posts", icon: FileText },
  { href: "/dashboard/media", label: "Media Library", icon: ImageIcon },
  { href: "/dashboard/categories", label: "Categories", icon: Folder, canAdd: true },
  { href: "/dashboard/tags", label: "Tags", icon: Tag },
  { href: "/dashboard/authors", label: "Authors", icon: Users },
  { href: "/dashboard/team", label: "Team & Invites", icon: Users },
  { href: "/dashboard/webhooks", label: "Webhooks & Sync", icon: Webhook },
  { href: "/dashboard/audit", label: "Audit Logs", icon: Shield },
  { href: "/dashboard/settings", label: "Website Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isEditor = pathname?.includes("/editor");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Guard: redirect pending/rejected/suspended users away from dashboard
  useEffect(() => {
    if (isEditor) {
      setCheckingStatus(false);
      return;
    }
    fetch("/api/auth/user-status")
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "pending" || data.status === "rejected" || data.status === "suspended") {
          window.location.href = "/pending-approval";
          return;
        }
        setCheckingStatus(false);
      })
      .catch(() => setCheckingStatus(false));
  }, [pathname, isEditor]);

  // Quick Add Category Modal State
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;

    setIsSubmittingCat(true);
    setCatError(null);
    try {
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (activeProjId) headers["X-OpenPost-Project"] = activeProjId;

      const res = await fetch("/api/v1/categories", {
        method: "POST",
        headers,
        body: JSON.stringify({ name, projectId: activeProjId || undefined }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create category");
      }

      setNewCatName("");
      setIsAddCatModalOpen(false);
      window.dispatchEvent(new Event("projectChanged"));
      if (pathname?.includes("/categories")) {
        router.refresh();
      }
    } catch (err: any) {
      setCatError(err.message || "Failed to create category");
    } finally {
      setIsSubmittingCat(false);
    }
  };

  if (isEditor) {
    return <div className="min-h-screen bg-surface">{children}</div>;
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-[#F0F0F1] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F0F0F1] flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex w-80 shrink-0 flex-col border-r border-border bg-white fixed left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.02)]">
        {/* Project / Multi-Website Switcher */}
        <ProjectSwitcher />

        {/* Navigation Menu */}
        <div className="px-4 py-2.5">
          <span className="text-[10px] font-bold tracking-widest text-text-tertiary uppercase">
            Website Content &amp; Ops
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-auto pb-4">
          {nav.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <div key={item.href} className="group relative flex items-center">
                <Link
                  href={item.href}
                  className={`flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#2D3440] text-white shadow-xs font-semibold"
                      : "text-text-secondary hover:bg-[#F0F0F1] hover:text-navy"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? "text-[#FEA611]" : ""}`} />
                  <span>{item.label}</span>
                </Link>

                {item.canAdd && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsAddCatModalOpen(true);
                    }}
                    className={`absolute right-2 flex h-6 w-6 items-center justify-center rounded-lg border transition ${
                      isActive
                        ? "border-white/20 text-white/80 hover:bg-white/20 hover:text-white"
                        : "border-border text-slate-400 hover:bg-surface-raised hover:text-navy"
                    }`}
                    title="Quick Add Category"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer Action */}
        <div className="p-3 border-t border-border bg-[#FCFCF9]">
          <Link
            href="/projects/new"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#FEA611] px-4 py-2.5 text-sm font-bold text-[#2D3440] hover:bg-[#FE990E] hover:text-white transition shadow-xs"
          >
            <Plus className="h-4 w-4" /> New Website
          </Link>
          <div className="mt-2 flex items-center justify-between text-[11px] text-text-tertiary px-1">
            <span>OpenPost Studio</span>
            <Link href="/blog" target="_blank" className="hover:text-navy flex items-center gap-0.5">
              Live Blog <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col md:ml-80">
        {/* Mobile Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-[#C3C4C7] bg-white px-4 sm:px-6 md:hidden shrink-0 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-navy"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.svg" alt="OpenPost" className="h-7 w-7" />
            <span className="text-sm font-bold text-navy">
              Open<span className="text-brand">Post</span>
            </span>
          </Link>
          <Link
            href="/dashboard/editor"
            className="rounded-xl bg-brand px-3.5 py-1.5 text-xs font-bold text-navy shadow-xs"
          >
            + Post
          </Link>
        </header>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-navy/40 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white border-r border-border flex flex-col shadow-xl z-50 overflow-y-auto">
              <div className="flex h-16 items-center justify-between px-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <img src="/logo.svg" alt="OpenPost" className="h-7 w-7" />
                  <span className="text-sm font-bold text-navy">
                    Open<span className="text-[#FEA611]">Post</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-navy"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Project Switcher in Mobile Drawer */}
              <ProjectSwitcher />

              <nav className="flex-1 p-4 space-y-1 overflow-auto">
                {nav.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === item.href || pathname?.startsWith(item.href + "/");

                  return (
                    <div key={item.href} className="flex items-center justify-between">
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                          isActive
                            ? "bg-[#2D3440] text-white font-bold"
                            : "text-text-secondary hover:bg-[#F0F0F1]"
                        }`}
                      >
                        <item.icon className={`h-4 w-4 ${isActive ? "text-[#FEA611]" : ""}`} />
                        {item.label}
                      </Link>
                      {item.canAdd && (
                        <button
                          type="button"
                          onClick={() => {
                            setMobileOpen(false);
                            setIsAddCatModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-navy"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border">
                <Link
                  href="/projects/new"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#FEA611] px-4 py-2.5 text-sm font-bold text-[#2D3440]"
                >
                  <Plus className="h-4 w-4" /> New Website
                </Link>
              </div>
            </aside>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Quick Add Category Modal */}
      {isAddCatModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddCatModalOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl animate-in zoom-in-95 text-navy">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/15 text-navy">
                  <Folder className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-navy">Create New Category</h3>
              </div>
              <button
                onClick={() => setIsAddCatModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {catError && (
              <p className="mb-3 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-semibold">
                {catError}
              </p>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Category Name *</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Engineering, Product, Tutorials"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy font-semibold focus:border-brand focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCatModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-navy hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCat || !newCatName.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-xs font-bold text-navy hover:bg-brand-hover hover:text-white transition disabled:opacity-50 shadow-xs"
                >
                  {isSubmittingCat ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
