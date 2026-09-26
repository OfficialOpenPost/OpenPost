"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  Tag,
  Folder,
  Users,
  Settings,
  Webhook,
  Menu,
  X,
  ExternalLink,
  Shield,
  Plus,
  Check,
  Loader2,
  ChevronsLeft,
  ChevronsRight,
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

/* ── Sidebar sizing ──────────────────────────────────────────────────────────
 * Persisted via localStorage (same openpost_* convention as the project
 * switcher). Two independent concepts:
 *   • width    — user-resizable expanded width  [220px … 360px]
 *   • collapsed — explicit or drag-triggered icon-only mode (64px)
 * Dragging the right edge below 220px switches to compact mode; dragging a
 * compact sidebar right past 220px expands it again. Explicit collapse
 * persists until the user expands.                                      */
const SIDEBAR_WIDTH_KEY = "openpost_sidebar_width";
const SIDEBAR_COLLAPSED_KEY = "openpost_sidebar_collapsed";
const SIDEBAR_COMPACT_W = 64;
const SIDEBAR_MIN = 220;
const SIDEBAR_MAX = 360;
const SIDEBAR_DEFAULT = 320;

const clampWidth = (v: number) => Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, v));

type NavItemData = (typeof nav)[number];

function NavItem({
  item,
  isActive,
  compact,
  onQuickAdd,
  onNavigate,
}: {
  item: NavItemData;
  isActive: boolean;
  compact?: boolean;
  onQuickAdd?: () => void;
  onNavigate?: () => void;
}) {
  const icon = <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#FEA611]" : ""}`} />;

  if (compact) {
    return (
      <div className="flex items-center justify-center">
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-label={item.label}
          aria-current={isActive ? "page" : undefined}
          title={item.label}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
            isActive
              ? "bg-[#2D3440] shadow-xs"
              : "text-text-secondary hover:bg-[#F0F0F1] hover:text-navy"
          }`}
        >
          {icon}
        </Link>
      </div>
    );
  }

  return (
    <div className="group relative flex items-center">
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={`flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? "bg-[#2D3440] text-white shadow-xs font-semibold"
            : "text-text-secondary hover:bg-[#F0F0F1] hover:text-navy"
        }`}
      >
        {icon}
        <span className="truncate">{item.label}</span>
      </Link>

      {item.canAdd && onQuickAdd && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onQuickAdd();
          }}
          aria-label="Quick add category"
          title="Quick Add Category"
          className={`absolute right-2 flex h-6 w-6 items-center justify-center rounded-lg border transition ${
            isActive
              ? "border-white/20 text-white/80 hover:bg-white/20 hover:text-white"
              : "border-border text-slate-400 hover:bg-surface-raised hover:text-navy"
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isEditor = pathname?.includes("/editor");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  /* Sidebar state */
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const pendingWidthRef = useRef(SIDEBAR_DEFAULT);
  const rafRef = useRef<number | null>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const drawerWasOpen = useRef(false);

  // Hydrate persisted preferences (client-only, avoids SSR mismatch).
  // Reading localStorage must happen post-mount; setting state here is the
  // official pattern to avoid hydration mismatches.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY));
      if (Number.isFinite(saved) && saved > 0) setSidebarWidth(clampWidth(saved));
      setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      /* storage unavailable — keep defaults */
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist preferences
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore quota errors */
    }
  }, [sidebarWidth, sidebarCollapsed, hydrated]);

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

  // Mobile drawer: Escape to close, focus management, body scroll lock
  useEffect(() => {
    if (!mobileOpen) {
      drawerWasOpen.current = false;
      return;
    }
    drawerWasOpen.current = true;
    document.body.style.overflow = "hidden";
    drawerCloseRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  // Drag-to-resize: rAF-throttled width updates, no text selection while dragging
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    pendingWidthRef.current = sidebarWidth;
    setIsResizing(true);
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isResizing) return;
    document.body.classList.add("select-none", "cursor-col-resize");

    const onMove = (e: MouseEvent) => {
      const raw = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_COMPACT_W, e.clientX));
      if (sidebarCollapsed) {
        // Dragging a compact sidebar right — expand once past the threshold.
        if (raw >= SIDEBAR_MIN) {
          setSidebarCollapsed(false);
          setSidebarWidth(clampWidth(raw));
          pendingWidthRef.current = raw;
        }
      } else if (raw < SIDEBAR_MIN) {
        // Dragging below the expanded minimum — switch to compact mode.
        // The stored expanded width is preserved for when the user re-expands.
        setSidebarCollapsed(true);
      } else {
        pendingWidthRef.current = raw;
        if (rafRef.current == null) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            setSidebarWidth(clampWidth(pendingWidthRef.current));
          });
        }
      }
    };

    const onUp = () => {
      setIsResizing(false);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (!sidebarCollapsed) setSidebarWidth(clampWidth(pendingWidthRef.current));
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.classList.remove("select-none", "cursor-col-resize");
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isResizing, sidebarCollapsed]);

  // Keyboard resize on the separator handle
  const handleResizeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      if (sidebarCollapsed) {
        if (dir > 0) setSidebarCollapsed(false);
      } else {
        const next = sidebarWidth + dir * 16;
        if (next < SIDEBAR_MIN) setSidebarCollapsed(true);
        else setSidebarWidth(clampWidth(next));
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSidebarCollapsed((c) => !c);
    }
  };

  // Quick Add Category Modal State
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const openQuickAddCategory = useCallback(() => setIsAddCatModalOpen(true), []);

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

  const visualWidth = sidebarCollapsed ? SIDEBAR_COMPACT_W : sidebarWidth;
  const isCompact = sidebarCollapsed;

  return (
    <div
      className="min-h-[calc(100vh-4rem)] bg-[#F0F0F1] flex"
      style={{ "--sidebar-w": `${visualWidth}px` } as React.CSSProperties}
    >
      {/* Desktop Left Sidebar */}
      <aside
        aria-label="Dashboard sidebar"
        style={{ width: "var(--sidebar-w)" }}
        className={`hidden md:flex shrink-0 flex-col border-r border-border bg-white fixed left-0 top-16 h-[calc(100vh-4rem)] overflow-hidden z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.02)] ${
          isResizing ? "select-none" : "transition-[width] duration-200 ease-out"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden">
          {/* Project / Multi-Website Switcher */}
          <ProjectSwitcher compact={isCompact} />

          {/* Section label + collapse toggle */}
          <div className={`flex items-center gap-1 px-2 py-2 ${isCompact ? "justify-center px-1" : "px-4 justify-between"}`}>
            {!isCompact && (
              <span className="text-[10px] font-bold tracking-widest text-text-tertiary uppercase whitespace-nowrap overflow-hidden">
                Website Content &amp; Ops
              </span>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-label={isCompact ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!isCompact}
              title={isCompact ? "Expand sidebar" : "Collapse sidebar"}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-tertiary transition hover:bg-[#F0F0F1] hover:text-navy ${
                isCompact ? "" : ""
              }`}
            >
              {isCompact ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className={`flex-1 space-y-1 overflow-auto pb-4 ${isCompact ? "px-2" : "px-3"}`} aria-label="Dashboard navigation">
            {nav.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href || pathname?.startsWith(item.href + "/");

              return (
                <NavItem
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  compact={isCompact}
                  onQuickAdd={openQuickAddCategory}
                />
              );
            })}
          </nav>

          {/* Sidebar Footer Action */}
          <div className={`border-t border-border bg-[#FCFCF9] ${isCompact ? "p-2" : "p-3"}`}>
            {isCompact ? (
              <Link
                href="/projects/new"
                aria-label="New Website"
                title="New Website"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEA611] text-[#2D3440] hover:bg-[#FE990E] hover:text-white transition shadow-xs mx-auto"
              >
                <Plus className="h-4 w-4" />
              </Link>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Professional resize handle (drag, double-click to toggle, keyboard) */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          aria-valuenow={visualWidth}
          aria-valuemin={SIDEBAR_COMPACT_W}
          aria-valuemax={SIDEBAR_MAX}
          tabIndex={0}
          onMouseDown={startResize}
          onKeyDown={handleResizeKeyDown}
          onDoubleClick={() => setSidebarCollapsed((c) => !c)}
          title="Drag to resize · double-click to collapse/expand"
          className={`absolute top-0 right-0 z-30 h-full w-1.5 cursor-col-resize rounded-l-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
            isResizing ? "bg-brand/70" : "hover:bg-brand/50"
          }`}
        />
      </aside>

      {/* Main Content Area — width follows the sidebar CSS variable */}
      <div
        className={`flex-1 min-w-0 flex flex-col md:ml-[var(--sidebar-w)] ${
          isResizing ? "" : "transition-[margin-left] duration-200 ease-out"
        }`}
      >
        {/* Mobile Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-[#C3C4C7] bg-white px-4 sm:px-6 md:hidden shrink-0 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-navy"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
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
              aria-hidden="true"
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white border-r border-border flex flex-col shadow-xl z-50 overflow-y-auto"
            >
              <div className="flex h-16 items-center justify-between px-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <img src="/logo.svg" alt="OpenPost" className="h-7 w-7" />
                  <span className="text-sm font-bold text-navy">
                    Open<span className="text-[#FEA611]">Post</span>
                  </span>
                </div>
                <button
                  ref={drawerCloseRef}
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-navy"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Project Switcher in Mobile Drawer */}
              <ProjectSwitcher onNavigate={() => setMobileOpen(false)} />

              <nav className="flex-1 p-4 space-y-1 overflow-auto" aria-label="Dashboard navigation">
                {nav.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === item.href || pathname?.startsWith(item.href + "/");

                  return (
                    <NavItem
                      key={item.href}
                      item={item}
                      isActive={isActive}
                      onQuickAdd={() => {
                        setMobileOpen(false);
                        openQuickAddCategory();
                      }}
                      onNavigate={() => setMobileOpen(false)}
                    />
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
                aria-label="Close dialog"
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
