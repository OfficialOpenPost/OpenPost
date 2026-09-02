"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Globe,
  Users,
  Image as ImageIcon,
  Search,
  Clock,
  Shield,
  Database,
  Check,
  Copy,
  Plus,
  Trash2,
  Layers,
  RefreshCw,
  Loader2,
  X,
  ExternalLink,
  Info,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";

const TABS = [
  { id: "general", label: "General", icon: Globe, desc: "Publication identity" },
  { id: "website", label: "Website", icon: Globe, desc: "Site config for CLI" },
  { id: "users", label: "Team", icon: Users, desc: "Members & access" },
  { id: "media", label: "Media", icon: ImageIcon, desc: "Storage & processing" },
  { id: "seo", label: "SEO", icon: Search, desc: "Social & metadata" },
  { id: "publishing", label: "Publishing", icon: Clock, desc: "Workflow & schedule" },
  { id: "api", label: "API Keys", icon: Database, desc: "Headless tokens" },
  { id: "security", label: "Security", icon: Shield, desc: "Sessions & access" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("CONTRIBUTOR");
  const [inviting, setInviting] = useState(false);

  const [tokens, setTokens] = useState<any[]>([]);
  const [newTokenName, setNewTokenName] = useState("");
  const [createdRawToken, setCreatedRawToken] = useState<string | null>(null);
  const [creatingToken, setCreatingToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showRawToken, setShowRawToken] = useState(true);

  const [activeProject, setActiveProject] = useState<any>(null);
  const [copiedProjectId, setCopiedProjectId] = useState(false);
  const [copiedProjectSlug, setCopiedProjectSlug] = useState(false);

  const loadAllSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, usersRes, tokensRes] = await Promise.all([
        fetch("/api/settings").then((r) => r.json()).catch(() => ({ data: {} })),
        fetch("/api/settings/users").then((r) => r.json()).catch(() => ({ data: { users: [] } })),
        fetch("/api/settings/tokens").then((r) => r.json()).catch(() => ({ data: [] })),
      ]);
      if (settingsRes.data) setSettings(settingsRes.data);
      if (Array.isArray(usersRes.data?.users)) setTeamUsers(usersRes.data.users);
      if (Array.isArray(tokensRes.data)) setTokens(tokensRes.data);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllSettings();
    const loadActiveProject = async () => {
      try {
        const pid = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
        if (!pid) return;
        const res = await fetch("/api/projects").then((r) => r.json()).catch(() => ({ data: [] }));
        const proj = Array.isArray(res.data) ? res.data.find((p: any) => p.id === pid) : null;
        if (proj) setActiveProject(proj);
        else if (pid) setActiveProject({ id: pid, name: "Active Project", slug: "" });
      } catch {}
    };
    loadActiveProject();
    const handler = () => loadActiveProject();
    window.addEventListener("projectChanged", handler);
    return () => window.removeEventListener("projectChanged", handler);
  }, []);

  const handleSaveSection = async (section: string, data: any) => {
    try {
      setSaving(true);
      setSaveStatus(null);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      setSaveStatus("Saved");
      setTimeout(() => setSaveStatus(null), 2500);
      setSettings((prev: any) => ({ ...prev, [section]: data }));
    } catch (err: any) {
      setSaveStatus(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const res = await fetch("/api/settings/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, projectId: activeProjId || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to update status");
      setTeamUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
      setSaveStatus(`Status → ${status}`);
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateRole = async (id: string, role: string) => {
    try {
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      if (!activeProjId) {
        alert("Please select an active website project first.");
        return;
      }
      const res = await fetch("/api/settings/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role, projectId: activeProjId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to update role");
      setTeamUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
      setSaveStatus(`Role → ${role}`);
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      setInviting(true);
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      if (!activeProjId) throw new Error("Select a project in the sidebar.");
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), name: inviteName.trim(), role: inviteRole, projectId: activeProjId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to add team member");
      await loadAllSettings();
      setInviteEmail("");
      setInviteName("");
      setSaveStatus("Invited");
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Remove this member from the project?")) return;
    try {
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const url = activeProjId ? `/api/settings/users?id=${id}&projectId=${activeProjId}` : `/api/settings/users?id=${id}`;
      const res = await fetch(url, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to remove user");
      setTeamUsers((prev) => prev.filter((u) => u.id !== id));
      setSaveStatus("Removed");
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err: any) {
      alert(err.message || "Failed to remove user");
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;
    try {
      setCreatingToken(true);
      const res = await fetch("/api/settings/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTokenName.trim() }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Failed to create token");
      }
      const json = await res.json();
      setCreatedRawToken(json.data.rawToken);
      setTokens((prev) => [json.data, ...prev]);
      setNewTokenName("");
    } catch (err: any) {
      alert(err.message || "Could not generate API token");
    } finally {
      setCreatingToken(false);
    }
  };

  const handleRevokeToken = async (id: string) => {
    if (!confirm("Revoke this API key? Frontends using it will break.")) return;
    try {
      await fetch(`/api/settings/tokens?id=${id}`, { method: "DELETE" });
      setTokens((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert("Failed to revoke token");
    }
  };

  if (loading || !settings) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <Loader2 className="h-5 w-5 animate-spin text-brand" /> Loading settings…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Horizontal top nav — floating/sticky Settings tabs (all options visible via scroll on small screens) */}
        <div className="sticky top-16 z-20 rounded-xl border border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm p-1.5 flex gap-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent snap-x snap-mandatory">
          {saveStatus && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 shrink-0 self-center mr-1">
              <Check className="h-3.5 w-3.5" /> {saveStatus}
            </span>
          )}
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left transition shrink-0 snap-start ${
                  active ? "bg-navy text-white shadow-sm" : "text-text-secondary hover:bg-surface-raised hover:text-navy"
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${active ? "bg-white/15 text-white" : "bg-surface-raised text-text-tertiary"}`}>
                  <tab.icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-[13px] font-semibold leading-none">{tab.label}</span>
                  <span className={`hidden sm:block text-[11px] leading-none mt-0.5 ${active ? "text-white/70" : "text-text-tertiary"}`}>{tab.desc}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="min-w-0 space-y-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Project ID — Sanity-like dataset card */}
              <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-[#FCFCF9] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-navy"><Database className="h-3.5 w-3.5" /></span>
                    <div>
                      <h3 className="text-sm font-semibold text-navy">Project</h3>
                      <p className="text-xs text-text-secondary">Active dataset for API & CMS</p>
                    </div>
                  </div>
                  {activeProject?.id && <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>}
                </div>
                <div className="p-5 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Project ID</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded-lg border border-border bg-surface-raised px-3 py-2.5 font-mono text-xs text-navy">{activeProject?.id || "— no project selected —"}</code>
                      <button
                        disabled={!activeProject?.id}
                        onClick={() => {
                          if (!activeProject?.id) return;
                          navigator.clipboard.writeText(activeProject.id);
                          setCopiedProjectId(true);
                          setTimeout(() => setCopiedProjectId(false), 2000);
                        }}
                        className="inline-flex h-[38px] items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold hover:bg-surface-raised disabled:opacity-50"
                      >
                        {copiedProjectId ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedProjectId ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-xs text-text-tertiary">Use as <code className="font-mono bg-surface-raised border border-border px-1 rounded">OPENPOST_PROJECT_ID</code> in your frontend</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Slug & Name</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded-lg border border-border bg-surface-raised px-3 py-2.5 font-mono text-xs text-navy">{activeProject?.slug ? `${activeProject.slug} · ${activeProject.name}` : "—"}</code>
                      <button
                        disabled={!activeProject?.slug}
                        onClick={() => {
                          if (!activeProject?.slug) return;
                          navigator.clipboard.writeText(activeProject.slug);
                          setCopiedProjectSlug(true);
                          setTimeout(() => setCopiedProjectSlug(false), 2000);
                        }}
                        className="inline-flex h-[38px] items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold hover:bg-surface-raised disabled:opacity-50"
                      >
                        {copiedProjectSlug ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedProjectSlug ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-xs text-text-tertiary">Or query <code className="font-mono bg-surface-raised border border-border px-1 rounded">?project={activeProject?.slug || "slug"}</code></p>
                  </div>
                </div>
                <div className="px-5 pb-4">
                  <div className="rounded-lg bg-surface-raised border border-border p-3 flex flex-wrap gap-2 text-xs font-mono">
                    <span className="text-text-tertiary">ENV:</span> <span>OPENPOST_URL={typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}</span>
                    <span className="text-border">|</span> <span>OPENPOST_PROJECT_ID={activeProject?.id?.slice(0, 8) || "—"}…</span>
                  </div>
                </div>
              </div>

              {/* General */}
              <div className="rounded-xl border border-border bg-white shadow-sm">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="text-sm font-semibold text-navy">General</h2>
                  <p className="text-xs text-text-secondary mt-1">Publication identity and regional defaults</p>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as any;
                    handleSaveSection("general", {
                      siteName: form.siteName.value,
                      tagline: form.tagline.value,
                      siteUrl: form.siteUrl.value,
                      timezone: form.timezone.value,
                      locale: form.locale.value,
                      primaryColor: form.primaryColor.value,
                      logoUrl: form.logoUrl.value,
                    });
                  }}
                  className="p-5 space-y-5"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-navy">Publication name</span>
                      <input name="siteName" defaultValue={settings.general?.siteName || "OpenPost Publication"} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" required />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-navy">Logo URL</span>
                      <input name="logoUrl" defaultValue={settings.general?.logoUrl || "/logo.svg"} placeholder="/logo.svg or https://..." className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
                    </label>
                  </div>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Tagline</span>
                    <input name="tagline" defaultValue={settings.general?.tagline || ""} placeholder="Professional blog CMS..." className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Canonical URL</span>
                    <input name="siteUrl" defaultValue={settings.general?.siteUrl || "http://localhost:3000"} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" required />
                    <span className="text-xs text-text-tertiary">Used for SEO, sitemaps, and canonical links</span>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-navy">Timezone</span>
                      <select name="timezone" defaultValue={settings.general?.timezone || "UTC"} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-navy focus:outline-none">
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New York</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="Asia/Kolkata">Asia/Kolkata</option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                        <option value="Australia/Sydney">Australia/Sydney</option>
                      </select>
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-navy">Locale</span>
                      <select name="locale" defaultValue={settings.general?.locale || "en-US"} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-navy focus:outline-none">
                        <option value="en-US">en-US</option>
                        <option value="en-GB">en-GB</option>
                        <option value="es-ES">es-ES</option>
                        <option value="fr-FR">fr-FR</option>
                        <option value="de-DE">de-DE</option>
                        <option value="hi-IN">hi-IN</option>
                      </select>
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-navy">Accent</span>
                      <span className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
                        <input type="color" name="primaryColor" defaultValue={settings.general?.primaryColor || "#FEA611"} className="h-7 w-7 rounded border-0 p-0 cursor-pointer" />
                        <span className="font-mono text-xs text-text-secondary">{settings.general?.primaryColor || "#FEA611"}</span>
                      </span>
                    </label>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-border">
                    <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "website" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-white shadow-sm">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="text-sm font-semibold text-navy">Website Configuration</h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Configure your website appearance — these details are used by <code className="font-mono bg-surface-raised px-1 rounded">openpost-cli</code> to customize your template
                  </p>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = e.target as any;
                    handleSaveSection("website", {
                      siteName: f.siteName.value,
                      siteTagline: f.siteTagline.value,
                      siteDescription: f.siteDescription.value,
                      siteLogoUrl: f.siteLogoUrl.value,
                      sitePrimaryColor: f.sitePrimaryColor.value,
                      siteUrl: f.siteUrl.value,
                      siteLanguage: f.siteLanguage.value,
                      siteTimezone: f.siteTimezone.value,
                    });
                  }}
                  className="p-5 space-y-5"
                >
                  <div className="rounded-lg bg-brand/5 border border-brand/20 p-3 mb-4">
                    <p className="text-xs text-navy font-semibold">How it works</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Fill in your website details below. When you run <code className="font-mono bg-surface-raised px-1 rounded">npx openpost-cli init</code>, these values are automatically injected into your Next.js template — no manual config needed.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-navy">Website Name *</span>
                      <input name="siteName" defaultValue={activeProject?.siteName || activeProject?.name || ""} placeholder="My Awesome Blog" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
                      <span className="text-xs text-text-tertiary">Shown in header, footer, and meta tags</span>
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-navy">Logo URL</span>
                      <input name="siteLogoUrl" defaultValue={activeProject?.siteLogoUrl || ""} placeholder="https://... or /logo.svg" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
                      <span className="text-xs text-text-tertiary">Leave empty for text-only header</span>
                    </label>
                  </div>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Tagline</span>
                    <input name="siteTagline" defaultValue={activeProject?.siteTagline || ""} placeholder="Ideas, insights, and stories..." className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
                    <span className="text-xs text-text-tertiary">Short tagline shown below the site name</span>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Description (SEO)</span>
                    <textarea name="siteDescription" rows={2} defaultValue={activeProject?.siteDescription || ""} placeholder="A blog about technology, engineering, and innovation..." className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
                    <span className="text-xs text-text-tertiary">Used in OpenGraph and meta description tags</span>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-navy">Canonical URL</span>
                      <input name="siteUrl" defaultValue={activeProject?.siteUrl || ""} placeholder="https://myblog.com" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-navy">Language</span>
                      <select name="siteLanguage" defaultValue={activeProject?.siteLanguage || "en"} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-navy focus:outline-none">
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="hi">हिन्दी</option>
                        <option value="ja">日本語</option>
                        <option value="pt">Português</option>
                      </select>
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-navy">Accent Color</span>
                      <span className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
                        <input type="color" name="sitePrimaryColor" defaultValue={activeProject?.sitePrimaryColor || "#FEA611"} className="h-7 w-7 rounded border-0 p-0 cursor-pointer" />
                        <span className="font-mono text-xs text-text-secondary">{activeProject?.sitePrimaryColor || "#FEA611"}</span>
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border">
                    <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save Website Config
                    </button>
                  </div>
                </form>
              </div>

              {/* Social Links */}
              <div className="rounded-xl border border-border bg-white shadow-sm">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="text-sm font-semibold text-navy">Social Links</h2>
                  <p className="text-xs text-text-secondary mt-1">Optional — shown in website footer and SEO metadata</p>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = e.target as any;
                    handleSaveSection("website", {
                      ...settings.website,
                      socialTwitter: f.socialTwitter.value,
                      socialGithub: f.socialGithub.value,
                      socialLinkedin: f.socialLinkedin.value,
                      socialYoutube: f.socialYoutube.value,
                      socialInstagram: f.socialInstagram.value,
                    });
                  }}
                  className="p-5 space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-navy">Twitter / X</span>
                      <input name="socialTwitter" defaultValue={activeProject?.socialTwitter || ""} placeholder="https://x.com/username" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-navy">GitHub</span>
                      <input name="socialGithub" defaultValue={activeProject?.socialGithub || ""} placeholder="https://github.com/username" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-navy">LinkedIn</span>
                      <input name="socialLinkedin" defaultValue={activeProject?.socialLinkedin || ""} placeholder="https://linkedin.com/in/username" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-navy">YouTube</span>
                      <input name="socialYoutube" defaultValue={activeProject?.socialYoutube || ""} placeholder="https://youtube.com/@channel" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-navy">Instagram</span>
                      <input name="socialInstagram" defaultValue={activeProject?.socialInstagram || ""} placeholder="https://instagram.com/username" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
                    </label>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-border">
                    <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save Social Links
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              {teamUsers.some((u) => u.status === "pending") && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Clock className="h-4 w-4" />
                    <h3 className="text-sm font-semibold">Pending approvals · {teamUsers.filter((u) => u.status === "pending").length}</h3>
                  </div>
                  <p className="mt-1 text-xs text-amber-800">New signups need approval before they can write.</p>
                  <div className="mt-4 divide-y divide-amber-200">
                    {teamUsers.filter((u) => u.status === "pending").map((u) => (
                      <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
                        <div>
                          <p className="text-sm font-semibold text-navy">{u.name || "New User"}</p>
                          <p className="text-xs font-mono text-text-secondary">{u.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateStatus(u.id, "approved")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button onClick={() => handleUpdateStatus(u.id, "rejected")} className="inline-flex items-center gap-1 rounded-lg bg-white border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface-raised">
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border bg-white shadow-sm">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-navy">Invite member</h3>
                  <p className="text-xs text-text-secondary mt-1">Email invite is project-scoped. New users land as <code className="font-mono bg-surface-raised px-1 rounded">pending</code> until approved.</p>
                </div>
                <form onSubmit={handleInviteUser} className="p-5 grid gap-3 sm:grid-cols-12 items-end">
                  <label className="sm:col-span-4 space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Email *</span>
                    <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="writer@example.com" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
                  </label>
                  <label className="sm:col-span-3 space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Name</span>
                    <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Jane Doe" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
                  </label>
                  <label className="sm:col-span-2 space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Role</span>
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-navy focus:outline-none">
                      <option value="OWNER">Owner</option>
                      <option value="ADMIN">Admin</option>
                      <option value="EDITOR">Editor</option>
                      <option value="AUTHOR">Author</option>
                      <option value="CONTRIBUTOR">Contributor</option>
                    </select>
                  </label>
                  <button type="submit" disabled={inviting} className="sm:col-span-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Invite
                  </button>
                </form>
              </div>

              <div className="rounded-xl border border-border bg-white shadow-sm">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy">Members · {teamUsers.length}</h3>
                  <span className="text-xs text-text-tertiary">{activeProject?.name || "All projects"}</span>
                </div>
                <div className="divide-y divide-border">
                  {teamUsers.length === 0 ? (
                    <p className="p-8 text-center text-sm text-text-tertiary">No members yet</p>
                  ) : (
                    teamUsers.map((u) => {
                      const isApproved = u.status === "approved";
                      const isPending = u.status === "pending";
                      const isSuspended = u.status === "suspended";
                      return (
                        <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 hover:bg-[#FCFCF9]">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white text-xs font-bold">
                              {(u.name || u.email).slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-navy truncate flex items-center gap-2">
                                {u.name || "Member"}
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase border ${isApproved ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isPending ? "bg-amber-50 text-amber-700 border-amber-200" : isSuspended ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                  {u.status}
                                </span>
                              </p>
                              <p className="text-xs font-mono text-text-tertiary truncate">{u.email} · {u.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <select value={u.role} onChange={(e) => handleUpdateRole(u.id, e.target.value)} className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold focus:border-navy focus:outline-none">
                              <option value="OWNER">OWNER</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="EDITOR">EDITOR</option>
                              <option value="AUTHOR">AUTHOR</option>
                              <option value="CONTRIBUTOR">CONTRIBUTOR</option>
                            </select>
                            {isApproved && (
                              <button onClick={() => handleUpdateStatus(u.id, "suspended")} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-raised">
                                Suspend
                              </button>
                            )}
                            {isSuspended && (
                              <button onClick={() => handleUpdateStatus(u.id, "approved")} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white">Reactivate</button>
                            )}
                            {isPending && (
                              <button onClick={() => handleUpdateStatus(u.id, "approved")} className="rounded-lg bg-navy px-2.5 py-1.5 text-xs font-semibold text-white">Approve</button>
                            )}
                            <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-text-tertiary hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "media" && (
            <div className="rounded-xl border border-border bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-navy">Media</h2>
                <p className="text-xs text-text-secondary mt-1">R2 bucket, CDN and image processing</p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = e.target as any;
                  handleSaveSection("media", {
                    storageProvider: f.storageProvider.value,
                    bucketName: f.bucketName.value,
                    publicCdnUrl: f.publicCdnUrl.value,
                    maxUploadSizeMb: parseInt(f.maxUploadSizeMb.value, 10),
                    maxDimensionPx: parseInt(f.maxDimensionPx?.value || "8000", 10),
                    autoWebP: f.autoWebP.checked,
                    autoAvif: f.autoAvif.checked,
                    stripExif: f.stripExif.checked,
                  });
                }}
                className="p-5 space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Provider</span>
                    <select name="storageProvider" defaultValue={settings.media?.storageProvider || "Cloudflare R2"} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm">
                      <option>Cloudflare R2</option>
                      <option>Amazon S3</option>
                      <option>Supabase Storage</option>
                      <option>Local Storage</option>
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Bucket</span>
                    <input name="bucketName" defaultValue={settings.media?.bucketName || "openpost-media"} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono" />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Public CDN URL</span>
                    <input name="publicCdnUrl" defaultValue={settings.media?.publicCdnUrl || "https://pub-7091.r2.dev"} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Max upload (MB)</span>
                    <input type="number" name="maxUploadSizeMb" defaultValue={settings.media?.maxUploadSizeMb || 25} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm" />
                  </label>
                </div>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-navy">Max dimension (px)</span>
                  <input type="number" name="maxDimensionPx" defaultValue={settings.media?.maxDimensionPx || 8000} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm" />
                  <span className="text-xs text-text-tertiary">Images larger than this are rejected before processing (prevents decompression bomb)</span>
                </label>
                <div className="rounded-lg border border-border bg-surface-raised p-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="autoWebP" defaultChecked={settings.media?.autoWebP !== false} className="rounded" /> Auto WebP (480/768/1200/1920)</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="autoAvif" defaultChecked={settings.media?.autoAvif !== false} className="rounded" /> AVIF for largest variants</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="stripExif" defaultChecked={settings.media?.stripExif !== false} className="rounded" /> Strip EXIF/GPS</label>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="rounded-xl border border-border bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-navy">SEO</h2>
                <p className="text-xs text-text-secondary mt-1">Defaults for title, description and social cards</p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = e.target as any;
                  handleSaveSection("seo", {
                    titleTemplate: f.titleTemplate.value,
                    defaultDescription: f.defaultDescription.value,
                    defaultOgImage: f.defaultOgImage.value,
                    robotsDirective: f.robotsDirective.value,
                    sitemapEnabled: f.sitemapEnabled.checked,
                    googleSiteVerification: f.googleSiteVerification.value,
                  });
                }}
                className="p-5 space-y-4"
              >
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-navy">Title template</span>
                  <input name="titleTemplate" defaultValue={settings.seo?.titleTemplate || "%title% — OpenPost"} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono" />
                  <span className="text-xs text-text-tertiary">Vars: %title%, %site_name%, %category%</span>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-navy">Default description</span>
                  <textarea name="defaultDescription" rows={2} defaultValue={settings.seo?.defaultDescription || ""} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm" />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-navy">OG image</span>
                    <input name="defaultOgImage" defaultValue={settings.seo?.defaultOgImage || "/images/hero_3d_mockup.jpg"} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Robots</span>
                    <select name="robotsDirective" defaultValue={settings.seo?.robotsDirective || "index, follow"} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm">
                      <option value="index, follow">index, follow</option>
                      <option value="noindex, nofollow">noindex, nofollow</option>
                      <option value="noindex, follow">noindex, follow</option>
                    </select>
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="sitemapEnabled" defaultChecked={settings.seo?.sitemapEnabled !== false} className="rounded" /> Enable sitemap.xml</label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-navy">Google verification</span>
                  <input name="googleSiteVerification" defaultValue={settings.seo?.googleSiteVerification || ""} placeholder="google-site-verification=..." className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono" />
                </label>
                <div className="flex justify-end"><button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save</button></div>
              </form>
            </div>
          )}

          {activeTab === "publishing" && (
            <div className="rounded-xl border border-border bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-navy">Publishing</h2>
                <p className="text-xs text-text-secondary mt-1">State machine, redirects and review rules</p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = e.target as any;
                  handleSaveSection("publishing", {
                    defaultPostStatus: f.defaultPostStatus.value,
                    autoSlugEnabled: f.autoSlugEnabled.checked,
                    enable301RedirectsOnSlugChange: f.enable301RedirectsOnSlugChange.checked,
                    trashRetentionDays: parseInt(f.trashRetentionDays.value, 10),
                    cronIntervalMins: parseInt(f.cronIntervalMins.value, 10),
                    requireReviewForContributors: f.requireReviewForContributors.checked,
                  });
                }}
                className="p-5 space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Default status</span>
                    <select name="defaultPostStatus" defaultValue={settings.publishing?.defaultPostStatus || "draft"} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Trash retention (days)</span>
                    <input type="number" name="trashRetentionDays" defaultValue={settings.publishing?.trashRetentionDays || 30} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Cron interval (min)</span>
                    <input type="number" name="cronIntervalMins" defaultValue={settings.publishing?.cronIntervalMins || 1} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm" />
                  </label>
                </div>
                <div className="space-y-2 rounded-lg border border-border bg-surface-raised p-3">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="autoSlugEnabled" defaultChecked={settings.publishing?.autoSlugEnabled !== false} className="rounded" /> Auto-generate slugs until manual edit</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enable301RedirectsOnSlugChange" defaultChecked={settings.publishing?.enable301RedirectsOnSlugChange !== false} className="rounded" /> 301 redirects on published slug change</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="requireReviewForContributors" defaultChecked={settings.publishing?.requireReviewForContributors !== false} className="rounded" /> Require review for Contributor</label>
                </div>
                <div className="flex justify-end"><button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save</button></div>
              </form>
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-white shadow-sm">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="text-sm font-semibold text-navy">API Keys</h2>
                  <p className="text-xs text-text-secondary mt-1">Scoped tokens for headless frontends — project: <code className="font-mono bg-surface-raised px-1 rounded border">{activeProject?.slug || "—"}</code></p>
                </div>
                <div className="p-5">
                  {createdRawToken && (
                    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5"><Check className="h-4 w-4" /> Copy now — shown once</span>
                        <button onClick={() => { navigator.clipboard.writeText(createdRawToken); setCopiedToken(true); setTimeout(() => setCopiedToken(false), 2000); }} className="rounded-lg bg-white border border-emerald-200 px-2.5 py-1 text-xs font-bold">
                          {copiedToken ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <code className="mt-2 block rounded-lg bg-white border border-emerald-200 p-3 font-mono text-xs break-all">{createdRawToken}</code>
                    </div>
                  )}
                  <form onSubmit={handleCreateToken} className="flex gap-2">
                    <input value={newTokenName} onChange={(e) => setNewTokenName(e.target.value)} placeholder="e.g. Production Website" className="flex-1 rounded-lg border border-border bg-white px-3 py-2.5 text-sm" required />
                    <button type="submit" disabled={creatingToken} className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">
                      {creatingToken ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Generate
                    </button>
                  </form>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-white shadow-sm">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy">Active tokens · {tokens.length}</h3>
                  <a href="/docs/api" target="_blank" className="text-xs font-medium text-brand hover:underline">API docs →</a>
                </div>
                <div className="divide-y divide-border">
                  {tokens.length === 0 ? (
                    <p className="p-8 text-center text-sm text-text-tertiary">No tokens yet — generate one above</p>
                  ) : (
                    tokens.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-navy flex items-center gap-1.5"><Key className="h-3.5 w-3.5 text-brand" /> {t.name}</p>
                          <p className="text-xs font-mono text-text-tertiary truncate">{t.tokenPrefix} · {new Date(t.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => handleRevokeToken(t.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Revoke</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="rounded-xl border border-border bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-navy">Security</h2>
                <p className="text-xs text-text-secondary mt-1">Sessions, lockout and HTTPS</p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = e.target as any;
                  handleSaveSection("security", {
                    sessionDurationDays: parseInt(f.sessionDurationDays.value, 10),
                    maxLoginAttempts: parseInt(f.maxLoginAttempts.value, 10),
                    lockoutDurationMins: parseInt(f.lockoutDurationMins.value, 10),
                    forceHttps: f.forceHttps.checked,
                  });
                }}
                className="p-5 space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Session (days)</span>
                    <input type="number" name="sessionDurationDays" defaultValue={settings.security?.sessionDurationDays || 30} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Max login attempts</span>
                    <input type="number" name="maxLoginAttempts" defaultValue={settings.security?.maxLoginAttempts || 5} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-navy">Lockout (minutes)</span>
                    <input type="number" name="lockoutDurationMins" defaultValue={settings.security?.lockoutDurationMins || 15} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm" />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="forceHttps" defaultChecked={settings.security?.forceHttps !== false} className="rounded" /> Enforce HTTPS + Secure cookies</label>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2">
                  <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed text-amber-800">Sessions use httpOnly, Secure, SameSite=Lax cookies via Supabase. Never expose <code className="font-mono bg-white px-1 rounded border">SUPABASE_SERVICE_ROLE_KEY</code>.</p>
                </div>
                <div className="flex justify-end"><button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save</button></div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
