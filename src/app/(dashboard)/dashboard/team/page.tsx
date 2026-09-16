"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Clock,
  Check,
  X,
  Plus,
  Trash2,
  Loader2,
  Search,
  AlertTriangle,
  Shield,
  UserPlus,
  Crown,
  Copy,
  Mail,
  RefreshCw,
  ExternalLink,
  Lock,
  UserCheck,
  UserX,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface TeamUser {
  id: string;
  name: string;
  email: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  role: "OWNER" | "ADMIN" | "EDITOR" | "AUTHOR" | "CONTRIBUTOR";
  memberships?: Array<{
    projectId: string;
    projectName: string;
    projectSlug: string;
    role: string;
  }>;
  createdAt: string;
}

interface InviteItem {
  id: string;
  email: string;
  role: string;
  tokenPreview?: string | null;
  createdAt: string;
  expiresAt?: string;
}

interface CurrentUserContext {
  id: string;
  role: string;
}

export default function TeamPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "suspended" | "rejected">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"OWNER" | "ADMIN" | "EDITOR" | "AUTHOR" | "CONTRIBUTOR">("CONTRIBUTOR");
  const [pendingRoleAssignments, setPendingRoleAssignments] = useState<Record<string, string>>({});
  const [inviting, setInviting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState<string>("");
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      let pid = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;

      // Auto-resolve project if none in storage
      if (!pid) {
        const pRes = await fetch("/api/projects").catch(() => null);
        if (pRes && pRes.ok) {
          const pData = await pRes.json();
          const list = pData.data || [];
          if (list.length > 0) {
            pid = list[0].id;
            setActiveProjectName(list[0].name);
            localStorage.setItem("openpost_active_project_id", pid!);
            window.dispatchEvent(new Event("projectChanged"));
          }
        }
      } else {
        fetch("/api/projects")
          .then((r) => r.json())
          .then((j) => {
            const proj = (j.data || []).find((p: any) => p.id === pid);
            if (proj) setActiveProjectName(proj.name);
          })
          .catch(() => {});
      }

      setActiveProjectId(pid);

      if (!pid) {
        setUsers([]);
        setInvites([]);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/settings/users?projectId=${pid}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load team data");

      setUsers(json.data.users || []);
      setInvites(json.data.invites || []);
      if (json.data.currentUser) {
        setCurrentUser(json.data.currentUser);
      }
    } catch (e: any) {
      showToast(e.message || "Failed to load team", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const handleProjectChanged = () => load();
    window.addEventListener("projectChanged", handleProjectChanged);
    return () => window.removeEventListener("projectChanged", handleProjectChanged);
  }, [load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    if (!activeProjectId) {
      showToast("Select a project first via the top switcher.", "error");
      return;
    }

    try {
      setInviting(true);
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim() || undefined,
          role: inviteRole,
          projectId: activeProjectId,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Invitation failed");

      await load();
      setInviteEmail("");
      setInviteName("");
      setInviteRole("CONTRIBUTOR");
      showToast(j.data.membership ? "Member added directly to project!" : "Invitation link generated and dispatched!");
    } catch (e: any) {
      showToast(e.message || "Failed to send invitation", "error");
    } finally {
      setInviting(false);
    }
  };

  const updateStatus = async (id: string, status: "approved" | "rejected" | "suspended", role?: string) => {
    if (!activeProjectId) return;
    try {
      const body: any = { id, status, projectId: activeProjectId };
      if (role) body.role = role;

      const res = await fetch("/api/settings/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Status update failed");

      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status, role: role ? (role as any) : u.role } : u)));
      showToast(`User status updated to ${status.toUpperCase()}`);
    } catch (e: any) {
      showToast(e.message || "Failed to update status", "error");
    }
  };

  const updateRole = async (id: string, role: string) => {
    if (!activeProjectId) {
      showToast("Select an active project first", "error");
      return;
    }
    try {
      const res = await fetch("/api/settings/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role, projectId: activeProjectId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Role change failed");

      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: role as any } : u)));
      showToast(`Role updated to ${role}`);
    } catch (e: any) {
      showToast(e.message || "Failed to update role", "error");
    }
  };

  const removeMember = async (id: string, name: string) => {
    if (!activeProjectId) return;
    if (!confirm(`Are you sure you want to remove "${name}" from this project?`)) return;

    try {
      const res = await fetch(`/api/settings/users?id=${id}&projectId=${activeProjectId}`, {
        method: "DELETE",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Failed to remove member");

      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast("Member successfully removed from project");
    } catch (e: any) {
      showToast(e.message || "Failed to remove member", "error");
    }
  };

  const revokeInvite = async (inviteId: string) => {
    if (!activeProjectId) return;
    if (!confirm("Revoke this pending invitation? The invite link will immediately expire.")) return;

    try {
      setRevokingId(inviteId);
      const res = await fetch(`/api/settings/users?inviteId=${inviteId}&projectId=${activeProjectId}`, {
        method: "DELETE",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Failed to revoke invite");

      setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
      showToast("Invitation revoked successfully");
    } catch (e: any) {
      showToast(e.message || "Failed to revoke invitation", "error");
    } finally {
      setRevokingId(null);
    }
  };

  const copyInviteCode = (invite: InviteItem) => {
    const preview = invite.tokenPreview || invite.id;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(preview);
      setCopiedInviteId(invite.id);
      showToast("Invite reference copied to clipboard");
      setTimeout(() => setCopiedInviteId(null), 2500);
    }
  };

  const ownerCount = users.filter((u) => u.role === "OWNER").length;
  const pendingUsers = users.filter((u) => u.status === "pending");
  const filteredUsers = users.filter((u) => {
    if (filter !== "all" && u.status !== filter) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search && !`${u.name} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-700 shadow-2xs">
            <Crown className="h-3 w-3 text-amber-600 fill-amber-500" />
            Owner
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-black uppercase text-indigo-700">
            <Shield className="h-3 w-3 text-indigo-600" />
            Admin
          </span>
        );
      case "EDITOR":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-black uppercase text-blue-700">
            Editor
          </span>
        );
      case "AUTHOR":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-700">
            Author
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
            Contributor
          </span>
        );
    }
  };

  const isCurrentUserOwner = currentUser?.role === "OWNER";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── 1. Header Banner & Context ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand/20 via-brand/10 to-amber-500/10 flex items-center justify-center text-navy shadow-xs">
            <Users className="h-6 w-6 text-brand" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-navy font-display">Team & Permissions</h1>
              {activeProjectName && (
                <span className="rounded-full bg-surface-raised border border-border px-3 py-0.5 text-xs font-bold text-navy">
                  {activeProjectName}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Manage project collaborators, invite bylines, inspect roles, and configure publishing authority.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusMsg && (
            <div
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-xs animate-in fade-in duration-150 ${
                statusMsg.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              {statusMsg.type === "success" ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {statusMsg.text}
            </div>
          )}
          <button
            onClick={load}
            disabled={loading}
            title="Refresh team data"
            className="rounded-xl border border-border bg-white p-2 text-text-secondary hover:text-navy hover:bg-surface-raised transition shadow-2xs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── 2. No Active Project Alert ── */}
      {!activeProjectId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3.5 text-sm text-amber-900 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">No Active Project Selected</p>
            <p className="text-xs text-amber-800/80 mt-1">
              Select a project from the top switcher bar to manage team members and send invitations.
            </p>
          </div>
        </div>
      )}

      {/* ── 3. Pending Approvals Queue Banner (New Signups) ── */}
      {pendingUsers.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50/90 to-amber-100/50 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-xs">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                  Pending Approvals ({pendingUsers.length})
                </h2>
                <p className="text-xs text-amber-900/80">
                  New users awaiting verification. They cannot access or contribute until approved.
                </p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white border border-amber-200 p-3.5 shadow-2xs"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-navy truncate">{u.name || u.email.split("@")[0]}</p>
                  <p className="text-[11px] font-mono text-text-tertiary truncate">{u.email}</p>
                  <span className="text-[10px] text-text-tertiary">
                    Signed up {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateStatus(u.id, "approved")}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => updateStatus(u.id, "rejected")}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Invite Member Form Card ── */}
      <div className="rounded-3xl border border-border bg-white p-6 md:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-navy font-display">Invite Team Member</h2>
            <p className="text-xs text-text-secondary">
              Directly add an existing user or generate a secure 7-day single-use invitation.
            </p>
          </div>
        </div>

        <form onSubmit={handleInvite} className="grid gap-3 sm:grid-cols-12 items-end pt-2">
          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-navy mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@publication.com"
                className="w-full rounded-xl border border-border bg-white pl-9 pr-3 py-2 text-xs text-navy placeholder:text-text-tertiary focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-navy mb-1">Full Name (Optional)</label>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-navy placeholder:text-text-tertiary focus:border-brand focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-navy mb-1">Project Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs font-bold text-navy focus:border-brand focus:outline-none"
            >
              {isCurrentUserOwner && <option value="OWNER">👑 Owner (Full Authority)</option>}
              <option value="ADMIN">🛡️ Admin (Manage & Publish)</option>
              <option value="EDITOR">✏️ Editor (Edit & Publish Any)</option>
              <option value="AUTHOR">✍️ Author (Publish Own)</option>
              <option value="CONTRIBUTOR">📝 Contributor (Drafts Only)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={inviting || !activeProjectId}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-navy hover:bg-brand-hover hover:text-white disabled:opacity-50 transition shadow-xs"
            >
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Send Invite
            </button>
          </div>
        </form>

        <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-text-tertiary border-t border-slate-100">
          <span className="font-semibold text-navy">Role Matrix:</span>
          <span><strong className="text-amber-700">OWNER</strong> (Project deletion & billing)</span>
          <span>&bull;</span>
          <span><strong className="text-indigo-700">ADMIN</strong> (Team & Settings)</span>
          <span>&bull;</span>
          <span><strong className="text-blue-700">EDITOR</strong> (Publish & schedule all)</span>
          <span>&bull;</span>
          <span><strong className="text-emerald-700">AUTHOR</strong> (Publish own)</span>
          <span>&bull;</span>
          <span><strong className="text-slate-600">CONTRIBUTOR</strong> (Submit for review)</span>
        </div>
      </div>

      {/* ── 5. Active Pending Invitations Section ── */}
      {invites.length > 0 && (
        <div className="rounded-3xl border border-border bg-white p-6 md:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-black text-navy uppercase tracking-wide">
                Pending Invitations ({invites.length})
              </h3>
            </div>
            <span className="text-xs text-text-tertiary">Valid for 7 days from issue date</span>
          </div>

          <div className="divide-y divide-border rounded-2xl border border-border bg-slate-50/50 overflow-hidden">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    @
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-navy">{inv.email}</p>
                      {getRoleBadge(inv.role)}
                    </div>
                    <p className="text-[11px] font-mono text-text-tertiary mt-0.5">
                      Sent on {new Date(inv.createdAt).toLocaleDateString()} &bull; Token Ref: {inv.tokenPreview || `${inv.id.slice(0, 8)}…`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyInviteCode(inv)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-surface-raised transition shadow-2xs"
                  >
                    {copiedInviteId === inv.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedInviteId === inv.id ? "Copied" : "Copy Ref"}
                  </button>
                  <button
                    onClick={() => revokeInvite(inv.id)}
                    disabled={revokingId === inv.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                  >
                    {revokingId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. Active Project Members List ── */}
      <div className="rounded-3xl border border-border bg-white p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-navy font-display flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand" />
              Project Members ({filteredUsers.length})
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Approved collaborators with active permissions on {activeProjectName || "this project"}.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search member..."
                className="h-9 rounded-xl border border-border bg-white pl-8 pr-3 text-xs text-navy focus:border-brand focus:outline-none shadow-2xs"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="h-9 rounded-xl border border-border bg-white px-2.5 text-xs font-bold text-navy shadow-2xs"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-xl border border-border bg-white px-2.5 text-xs font-bold text-navy shadow-2xs"
            >
              <option value="all">All Roles</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="EDITOR">Editor</option>
              <option value="AUTHOR">Author</option>
              <option value="CONTRIBUTOR">Contributor</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-text-tertiary flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-brand" /> Loading team members…
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-bold text-navy">No members matched your filters</p>
              <p className="text-xs text-text-tertiary">Try clearing the search query or role filter.</p>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isOwner = u.role === "OWNER";
              const isSoleOwner = isOwner && ownerCount <= 1;
              const isSelf = currentUser?.id === u.id;
              const isApproved = u.status === "approved";
              const isSuspended = u.status === "suspended";
              const isPending = u.status === "pending";

              return (
                <div
                  key={u.id}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                    isOwner ? "bg-amber-50/20 hover:bg-amber-50/40" : "hover:bg-slate-50/60"
                  }`}
                >
                  {/* Left: Avatar + Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center text-xs font-black shadow-2xs ${
                        isOwner
                          ? "bg-gradient-to-tr from-amber-400 to-amber-600 text-white ring-2 ring-amber-400/40"
                          : u.role === "ADMIN"
                          ? "bg-gradient-to-tr from-indigo-500 to-purple-600 text-white"
                          : "bg-brand/15 text-navy"
                      }`}
                    >
                      {u.name ? u.name.slice(0, 2).toUpperCase() : u.email.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-navy truncate">{u.name}</span>
                        {isSelf && (
                          <span className="rounded-full bg-slate-900 text-white px-2 py-0.2 text-[9px] font-bold">
                            You
                          </span>
                        )}
                        {getRoleBadge(u.role)}
                        <span
                          className={`rounded-full px-2 py-0.2 text-[9px] font-extrabold uppercase border ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isPending
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : isSuspended
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {u.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-text-tertiary truncate">
                        {u.email} &bull; Joined {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* Role Selector Guard */}
                    {isSoleOwner ? (
                      <div className="flex items-center gap-1 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-800">
                        <Lock className="h-3 w-3 text-amber-600" /> Sole Owner (Protected)
                      </div>
                    ) : (
                      <select
                        value={u.role}
                        disabled={!isCurrentUserOwner && isOwner}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-navy focus:border-brand focus:outline-none shadow-2xs disabled:opacity-50"
                      >
                        {isCurrentUserOwner && <option value="OWNER">👑 Owner</option>}
                        <option value="ADMIN">🛡️ Admin</option>
                        <option value="EDITOR">✏️ Editor</option>
                        <option value="AUTHOR">✍️ Author</option>
                        <option value="CONTRIBUTOR">📝 Contributor</option>
                      </select>
                    )}

                    {/* Status Actions */}
                    {isApproved && !isSelf && (
                      <button
                        onClick={() => updateStatus(u.id, "suspended")}
                        className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-surface-raised transition shadow-2xs"
                      >
                        Suspend
                      </button>
                    )}
                    {isSuspended && (
                      <button
                        onClick={() => updateStatus(u.id, "approved")}
                        className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
                      >
                        Reactivate
                      </button>
                    )}
                    {isPending && (
                      <button
                        onClick={() => updateStatus(u.id, "approved")}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
                      >
                        Approve
                      </button>
                    )}

                    {/* Delete Member */}
                    {!isSoleOwner && !isSelf && (
                      <button
                        onClick={() => removeMember(u.id, u.name || u.email)}
                        title="Remove member from project"
                        className="rounded-xl p-2 text-text-tertiary hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Informational Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-text-tertiary gap-2">
          <p>
            Role changes, approvals, and removals are audited in{" "}
            <Link href="/dashboard/audit" className="text-brand font-bold hover:underline">
              Audit Logs &rarr;
            </Link>
          </p>
          <p className="font-mono">Active Project ID: {activeProjectId || "None"}</p>
        </div>
      </div>
    </div>
  );
}
