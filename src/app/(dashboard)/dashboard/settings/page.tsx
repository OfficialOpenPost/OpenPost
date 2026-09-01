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
  Download,
  AlertCircle,
  Key,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";

const TABS = [
  { id: "general", label: "General", icon: Globe },
  { id: "users", label: "Team & Users", icon: Users },
  { id: "media", label: "Media Pipeline", icon: ImageIcon },
  { id: "seo", label: "SEO & Social", icon: Search },
  { id: "publishing", label: "Publishing Workflow", icon: Clock },
  { id: "api", label: "Headless API & Keys", icon: Database },
  { id: "security", label: "Security & Backup", icon: Shield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Users State
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("WRITER");
  const [inviting, setInviting] = useState(false);

  // Tokens State
  const [tokens, setTokens] = useState<any[]>([]);
  const [newTokenName, setNewTokenName] = useState("");
  const [createdRawToken, setCreatedRawToken] = useState<string | null>(null);
  const [creatingToken, setCreatingToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Load Settings, Users, and Tokens from API
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
  }, []);

  // Save Settings Section
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

      setSaveStatus("Settings saved successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
      setSettings((prev: any) => ({ ...prev, [section]: data }));
    } catch (err: any) {
      setSaveStatus(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Update User Status (pending -> approved, approved -> suspended, etc.)
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
      setSaveStatus(`User status updated to ${status}!`);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Update User Role (ADMIN, EDITOR, WRITER)
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
      setSaveStatus(`User role updated to ${role}!`);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Invite Team Member
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      if (!activeProjId) {
        throw new Error("Active website project ID not found. Select a project in the sidebar.");
      }
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          role: inviteRole,
          projectId: activeProjId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to add team member");
      await loadAllSettings();
      setInviteEmail("");
      setInviteName("");
      setSaveStatus("Team member added!");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInviting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    try {
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const url = activeProjId ? `/api/settings/users?id=${id}&projectId=${activeProjId}` : `/api/settings/users?id=${id}`;
      const res = await fetch(url, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to remove user");
      setTeamUsers((prev) => prev.filter((u) => u.id !== id));
      setSaveStatus("User removed from project.");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to remove user");
    }
  };

  // Create API Token
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

  // Revoke Token
  const handleRevokeToken = async (id: string) => {
    if (!confirm("Revoking this API key will immediately disable any frontend consuming it. Continue?")) return;
    try {
      await fetch(`/api/settings/tokens?id=${id}`, { method: "DELETE" });
      setTokens((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert("Failed to revoke token");
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-navy font-bold text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-brand" /> Loading configuration...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-navy">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-navy">
              Website &amp; CMS Settings
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary">
              Configure publication metadata, team access, SEO defaults, media storage, and headless APIs.
            </p>
          </div>
        </div>

        {saveStatus && (
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-800 animate-in fade-in">
            <Check className="h-4 w-4 text-emerald-600" /> {saveStatus}
          </div>
        )}
      </div>

      {/* Main Grid: Tabs Sidebar + Tab Content */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12 items-start">
        {/* Navigation Tabs */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-border bg-white p-2 shadow-xs space-y-1">
            {TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition text-left ${
                    isSelected
                      ? "bg-navy text-white shadow-xs"
                      : "text-text-secondary hover:bg-surface-dim hover:text-navy"
                  }`}
                >
                  <tab.icon className={`h-4 w-4 ${isSelected ? "text-brand" : "text-text-tertiary"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-4">
                General Publication Info
              </h2>
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
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Publication Name</label>
                  <input
                    name="siteName"
                    defaultValue={settings.general?.siteName || "OpenPost Publication"}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy focus:border-brand focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Tagline / Mission</label>
                  <input
                    name="tagline"
                    defaultValue={settings.general?.tagline || ""}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Canonical Website URL</label>
                  <input
                    name="siteUrl"
                    defaultValue={settings.general?.siteUrl || "http://localhost:3000"}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy focus:border-brand focus:outline-none font-mono"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Timezone</label>
                    <select
                      name="timezone"
                      defaultValue={settings.general?.timezone || "UTC"}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-xs text-navy focus:border-brand focus:outline-none"
                    >
                      <option value="UTC">UTC (Universal)</option>
                      <option value="America/New_York">America/New York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Default Locale</label>
                    <select
                      name="locale"
                      defaultValue={settings.general?.locale || "en-US"}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-xs text-navy focus:border-brand focus:outline-none"
                    >
                      <option value="en-US">English (US)</option>
                      <option value="en-GB">English (UK)</option>
                      <option value="es-ES">Español (ES)</option>
                      <option value="fr-FR">Français (FR)</option>
                      <option value="de-DE">Deutsch (DE)</option>
                      <option value="hi-IN">Hindi (IN)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Brand Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        name="primaryColor"
                        defaultValue={settings.general?.primaryColor || "#FEA611"}
                        className="h-9 w-9 rounded-lg border border-border p-0.5 cursor-pointer"
                      />
                      <span className="font-mono text-xs text-text-secondary">
                        {settings.general?.primaryColor || "#FEA611"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-navy shadow-xs hover:bg-brand-hover hover:text-white transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save General Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: TEAM & USERS */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* Pending Approval Queue */}
              {teamUsers.some((u) => u.status === "pending") && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-900 mb-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <h2 className="text-sm font-bold uppercase tracking-wider">
                      Pending Account Approvals ({teamUsers.filter((u) => u.status === "pending").length})
                    </h2>
                  </div>
                  <p className="text-xs text-amber-800/80 mb-4">
                    New signups require administrator approval before gaining access to any OpenPost CMS features.
                  </p>
                  <div className="divide-y divide-amber-200/60">
                    {teamUsers
                      .filter((u) => u.status === "pending")
                      .map((u) => (
                        <div key={u.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-navy">{u.name || "New User"}</p>
                            <p className="text-[11px] font-mono text-text-secondary">{u.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateStatus(u.id, "approved")}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(u.id, "rejected")}
                              className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition shadow-xs"
                            >
                              <X className="h-3.5 w-3.5" /> Reject
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Invite User Box */}
              <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-2">
                  Invite / Add Team Member
                </h2>
                <p className="text-xs text-text-secondary mb-4">
                  Add collaborators to the active project with canonical roles: Admin, Editor, or Writer.
                </p>
                <form onSubmit={handleInviteUser} className="grid gap-3 sm:grid-cols-12 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-navy mb-1">Email Address *</label>
                    <input
                      type="email"
                      placeholder="writer@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                      required
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-navy mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-navy mb-1">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-2.5 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="EDITOR">Editor</option>
                      <option value="WRITER">Writer</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={inviting}
                      className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-brand px-3 py-2 text-xs font-bold text-navy hover:bg-brand-hover hover:text-white transition shadow-xs disabled:opacity-50"
                    >
                      {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Add Member
                    </button>
                  </div>
                </form>
              </div>

              {/* All Users & Team Table */}
              <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
                <h3 className="text-sm font-bold text-navy mb-4">All Users &amp; Collaborators</h3>
                <div className="divide-y divide-border">
                  {teamUsers.length === 0 ? (
                    <p className="text-xs text-text-tertiary py-4 text-center">No team members registered yet.</p>
                  ) : (
                    teamUsers.map((user) => {
                      const isApproved = user.status === "approved";
                      const isSuspended = user.status === "suspended";
                      const isPending = user.status === "pending";
                      const isRejected = user.status === "rejected";

                      return (
                        <div key={user.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/20 text-xs font-bold text-navy">
                              {user.name ? user.name.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-navy">{user.name || "Member"}</p>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                                    isApproved
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : isPending
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : isSuspended
                                      ? "bg-slate-100 text-slate-700 border border-slate-300"
                                      : "bg-rose-50 text-rose-700 border border-rose-200"
                                  }`}
                                >
                                  {user.status || "approved"}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-tertiary font-mono">{user.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <select
                              value={user.role || "WRITER"}
                              onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                              className="rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-bold text-navy focus:border-brand focus:outline-none"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="EDITOR">EDITOR</option>
                              <option value="WRITER">WRITER</option>
                            </select>

                            {isApproved && (
                              <button
                                onClick={() => handleUpdateStatus(user.id, "suspended")}
                                className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:bg-surface-dim transition"
                                title="Suspend user access"
                              >
                                Suspend
                              </button>
                            )}

                            {isSuspended && (
                              <button
                                onClick={() => handleUpdateStatus(user.id, "approved")}
                                className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                                title="Reactivate user access"
                              >
                                Reactivate
                              </button>
                            )}

                            {isPending && (
                              <button
                                onClick={() => handleUpdateStatus(user.id, "approved")}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                              >
                                Approve
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-text-tertiary hover:text-red-600 p-1.5 transition"
                              title="Remove from Project"
                            >
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

          {/* TAB 3: MEDIA PIPELINE */}
          {activeTab === "media" && (
            <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-4">
                Media Optimization &amp; Storage Engine
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as any;
                  handleSaveSection("media", {
                    storageProvider: form.storageProvider.value,
                    bucketName: form.bucketName.value,
                    publicCdnUrl: form.publicCdnUrl.value,
                    maxUploadSizeMb: parseInt(form.maxUploadSizeMb.value, 10),
                    autoWebP: form.autoWebP.checked,
                    autoAvif: form.autoAvif.checked,
                    stripExif: form.stripExif.checked,
                  });
                }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Storage Provider</label>
                    <select
                      name="storageProvider"
                      defaultValue={settings.media?.storageProvider || "Cloudflare R2"}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-xs text-navy focus:border-brand focus:outline-none"
                    >
                      <option value="Cloudflare R2">Cloudflare R2 (Zero Egress Fees)</option>
                      <option value="Amazon S3">Amazon Web Services S3</option>
                      <option value="Supabase Storage">Supabase S3 Bucket</option>
                      <option value="Local Storage">Local Filesystem (Self-Hosted)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Bucket Name</label>
                    <input
                      name="bucketName"
                      defaultValue={settings.media?.bucketName || "openpost-media"}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy focus:border-brand focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Public CDN Domain</label>
                    <input
                      name="publicCdnUrl"
                      defaultValue={settings.media?.publicCdnUrl || "https://pub-7091.r2.dev"}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy focus:border-brand focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Max Upload Size (MB)</label>
                    <input
                      type="number"
                      name="maxUploadSizeMb"
                      defaultValue={settings.media?.maxUploadSizeMb || 25}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-3 border-t border-border space-y-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-navy">
                    <input
                      type="checkbox"
                      name="autoWebP"
                      defaultChecked={settings.media?.autoWebP !== false}
                      className="rounded border-border text-brand focus:ring-brand h-4 w-4"
                    />
                    <span>Automate WebP responsive compression (480 / 768 / 1200 / 1920px)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-navy">
                    <input
                      type="checkbox"
                      name="autoAvif"
                      defaultChecked={settings.media?.autoAvif !== false}
                      className="rounded border-border text-brand focus:ring-brand h-4 w-4"
                    />
                    <span>Generate AVIF ultra-compressed variants for modern browsers</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-navy">
                    <input
                      type="checkbox"
                      name="stripExif"
                      defaultChecked={settings.media?.stripExif !== false}
                      className="rounded border-border text-brand focus:ring-brand h-4 w-4"
                    />
                    <span>Strip camera EXIF &amp; GPS location metadata for visitor privacy</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-border flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-navy shadow-xs hover:bg-brand-hover hover:text-white transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save Media Pipeline
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: SEO & SOCIAL */}
          {activeTab === "seo" && (
            <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-4">
                SEO Engine &amp; Social Defaults
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as any;
                  handleSaveSection("seo", {
                    titleTemplate: form.titleTemplate.value,
                    defaultDescription: form.defaultDescription.value,
                    defaultOgImage: form.defaultOgImage.value,
                    robotsDirective: form.robotsDirective.value,
                    googleSiteVerification: form.googleSiteVerification.value,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Global Meta Title Template</label>
                  <input
                    name="titleTemplate"
                    defaultValue={settings.seo?.titleTemplate || "%title% — OpenPost"}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy focus:border-brand focus:outline-none font-mono"
                  />
                  <p className="mt-1 text-[11px] text-text-tertiary">Variables: %title%, %site_name%, %category%</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Default Meta Description</label>
                  <textarea
                    rows={2}
                    name="defaultDescription"
                    defaultValue={settings.seo?.defaultDescription || ""}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Default OpenGraph Image URL</label>
                    <input
                      name="defaultOgImage"
                      defaultValue={settings.seo?.defaultOgImage || "/images/hero_3d_mockup.jpg"}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy focus:border-brand focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Robots.txt Directive</label>
                    <select
                      name="robotsDirective"
                      defaultValue={settings.seo?.robotsDirective || "index, follow"}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-xs text-navy focus:border-brand focus:outline-none"
                    >
                      <option value="index, follow">index, follow (Allow All Search Engines)</option>
                      <option value="noindex, nofollow">noindex, nofollow (Private / Staging)</option>
                      <option value="noindex, follow">noindex, follow (Internal Only)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Google Search Console Verification Tag</label>
                  <input
                    name="googleSiteVerification"
                    defaultValue={settings.seo?.googleSiteVerification || ""}
                    placeholder="google-site-verification=..."
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy focus:border-brand focus:outline-none font-mono"
                  />
                </div>

                <div className="pt-3 border-t border-border flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-navy shadow-xs hover:bg-brand-hover hover:text-white transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save SEO Defaults
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: PUBLISHING WORKFLOW */}
          {activeTab === "publishing" && (
            <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-4">
                Publishing &amp; Editorial State Machine
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as any;
                  handleSaveSection("publishing", {
                    defaultPostStatus: form.defaultPostStatus.value,
                    autoSlugEnabled: form.autoSlugEnabled.checked,
                    enable301RedirectsOnSlugChange: form.enable301RedirectsOnSlugChange.checked,
                    trashRetentionDays: parseInt(form.trashRetentionDays.value, 10),
                    requireReviewForContributors: form.requireReviewForContributors.checked,
                  });
                }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Default Post Status on Creation</label>
                    <select
                      name="defaultPostStatus"
                      defaultValue={settings.publishing?.defaultPostStatus || "draft"}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-xs text-navy focus:border-brand focus:outline-none"
                    >
                      <option value="draft">Draft (Private)</option>
                      <option value="published">Published (Instant Live)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Trash Retention Window (Days)</label>
                    <input
                      type="number"
                      name="trashRetentionDays"
                      defaultValue={settings.publishing?.trashRetentionDays || 30}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-border space-y-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-navy">
                    <input
                      type="checkbox"
                      name="autoSlugEnabled"
                      defaultChecked={settings.publishing?.autoSlugEnabled !== false}
                      className="rounded border-border text-brand focus:ring-brand h-4 w-4"
                    />
                    <span>Auto-generate clean slugs from article titles until manually customized</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-navy">
                    <input
                      type="checkbox"
                      name="enable301RedirectsOnSlugChange"
                      defaultChecked={settings.publishing?.enable301RedirectsOnSlugChange !== false}
                      className="rounded border-border text-brand focus:ring-brand h-4 w-4"
                    />
                    <span>Automate 301 Permanent Redirects in database whenever published slugs change</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-navy">
                    <input
                      type="checkbox"
                      name="requireReviewForContributors"
                      defaultChecked={settings.publishing?.requireReviewForContributors !== false}
                      className="rounded border-border text-brand focus:ring-brand h-4 w-4"
                    />
                    <span>Require Editor review before Contributor draft articles can be published</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-border flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-navy shadow-xs hover:bg-brand-hover hover:text-white transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save Publishing Rules
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: HEADLESS API & TOKENS */}
          {activeTab === "api" && (
            <div className="space-y-6">
              {/* Token Creation Box */}
              <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-2">
                  Headless REST API Keys
                </h2>
                <p className="text-xs text-text-secondary mb-4">
                  Generate scoped API tokens to securely query published articles, categories, and media from Next.js, Astro, or iOS apps.
                </p>

                {createdRawToken && (
                  <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-emerald-600" /> Token Generated! Copy it now (won't be shown again):
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(createdRawToken);
                          setCopiedToken(true);
                          setTimeout(() => setCopiedToken(false), 2000);
                        }}
                        className="flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-bold text-navy border border-emerald-200 hover:bg-emerald-100"
                      >
                        {copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedToken ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <code className="mt-2 block rounded bg-white p-2 font-mono text-xs text-emerald-800 break-all border border-emerald-200">
                      {createdRawToken}
                    </code>
                  </div>
                )}

                <form onSubmit={handleCreateToken} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Token label, e.g. Production Web Frontend"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={creatingToken}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-navy hover:bg-brand-hover hover:text-white transition shadow-xs disabled:opacity-50 shrink-0"
                  >
                    {creatingToken ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Generate Token
                  </button>
                </form>
              </div>

              {/* Active Tokens List */}
              <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
                <h3 className="text-sm font-bold text-navy mb-4">Active API Tokens</h3>
                <div className="divide-y divide-border">
                  {tokens.length === 0 ? (
                    <p className="text-xs text-text-tertiary py-4 text-center">No API tokens generated yet.</p>
                  ) : (
                    tokens.map((token) => (
                      <div key={token.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-navy flex items-center gap-1.5">
                            <Key className="h-3.5 w-3.5 text-brand" /> {token.name}
                          </p>
                          <p className="text-[11px] font-mono text-text-tertiary mt-0.5">
                            {token.tokenPrefix || "op_live_••••••"} · Created {new Date(token.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <button
                          onClick={() => handleRevokeToken(token.id)}
                          className="rounded-lg border border-border bg-surface-dim px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition"
                        >
                          Revoke
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SECURITY & BACKUP */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Security Policy Form */}
              <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-4">
                  Security &amp; Session Configuration
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as any;
                    handleSaveSection("security", {
                      sessionDurationDays: parseInt(form.sessionDurationDays.value, 10),
                      maxLoginAttempts: parseInt(form.maxLoginAttempts.value, 10),
                      forceHttps: form.forceHttps.checked,
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-navy mb-1">Session Duration (Days)</label>
                      <input
                        type="number"
                        name="sessionDurationDays"
                        defaultValue={settings.security?.sessionDurationDays || 30}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy focus:border-brand focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-navy mb-1">Max Login Attempts Before Lockout</label>
                      <input
                        type="number"
                        name="maxLoginAttempts"
                        defaultValue={settings.security?.maxLoginAttempts || 5}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy focus:border-brand focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-navy">
                      <input
                        type="checkbox"
                        name="forceHttps"
                        defaultChecked={settings.security?.forceHttps !== false}
                        className="rounded border-border text-brand focus:ring-brand h-4 w-4"
                      />
                      <span>Enforce Strict HTTPS and Secure SameSite session cookies</span>
                    </label>
                  </div>

                  <div className="pt-3 border-t border-border flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-navy shadow-xs hover:bg-brand-hover hover:text-white transition disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Save Security Policy
                    </button>
                  </div>
                </form>
              </div>

              {/* Sovereign Data Export & Backup Box */}
              <div className="rounded-2xl border border-border bg-white p-6 shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-navy">Sovereign Data Export &amp; Backup</h3>
                    <p className="mt-1 text-xs text-text-secondary max-w-lg">
                      Download a single-file JSON archive of all published articles, drafts, categories, tags, authors, media metadata, and system settings. Zero vendor lock-in.
                    </p>
                  </div>
                  <a
                    href="/api/settings/export"
                    download
                    className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-navy-dark transition shadow-xs shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Backup (.json)
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
