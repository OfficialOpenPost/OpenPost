"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Webhook,
  Globe,
  Shield,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  Power,
  ExternalLink,
  ChevronRight,
  Send,
  Radio,
  FileCode,
} from "lucide-react";

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string | null;
  secretConfigured?: boolean;
  secretPreview?: string | null;
  filter: string | null;
  isActive: boolean;
  retryCount: number;
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: "success" | "failed" | "pending";
  attempts: number;
  lastError: string | null;
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  { id: "post.published", label: "Post Published", group: "Posts" },
  { id: "post.updated", label: "Post Updated", group: "Posts" },
  { id: "post.created", label: "Post Created", group: "Posts" },
  { id: "post.deleted", label: "Post Deleted", group: "Posts" },
  { id: "post.scheduled", label: "Post Scheduled", group: "Posts" },
  { id: "category.created", label: "Category Created", group: "Taxonomy" },
  { id: "category.updated", label: "Category Updated", group: "Taxonomy" },
  { id: "tag.created", label: "Tag Created", group: "Taxonomy" },
  { id: "media.uploaded", label: "Media Uploaded", group: "Media" },
];

export default function WebhooksPage() {
  const [hooks, setHooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingHook, setEditingHook] = useState<WebhookItem | null>(null);
  const [form, setForm] = useState<{
    name: string;
    url: string;
    events: string[];
    secret: string;
    filter: string;
  }>({
    name: "",
    url: "",
    events: ["post.published"],
    secret: "",
    filter: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<WebhookItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Deliveries state
  const [activeDeliveryHook, setActiveDeliveryHook] = useState<WebhookItem | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [selectedPayload, setSelectedPayload] = useState<any | null>(null);

  // Fetch Webhooks
  const fetchHooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const params = new URLSearchParams();
      if (activeProjId) params.set("projectId", activeProjId);

      const url = params.toString() ? `/api/webhooks?${params.toString()}` : "/api/webhooks";
      const headers: Record<string, string> = {};
      if (activeProjId) headers["X-OpenPost-Project"] = activeProjId;

      const res = await fetch(url, { headers });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load webhooks");
      }

      setHooks(json.data || []);
    } catch (err: any) {
      console.error("Failed to fetch webhooks:", err);
      setError(err.message || "Failed to load webhooks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHooks();
    const handleProjectChanged = () => fetchHooks();
    window.addEventListener("projectChanged", handleProjectChanged);
    return () => window.removeEventListener("projectChanged", handleProjectChanged);
  }, [fetchHooks]);

  // Fetch Deliveries for a Webhook
  const openDeliveries = async (hook: WebhookItem) => {
    setActiveDeliveryHook(hook);
    setLoadingDeliveries(true);
    setSelectedPayload(null);
    try {
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const headers: Record<string, string> = {};
      if (activeProjId) headers["X-OpenPost-Project"] = activeProjId;

      const res = await fetch(`/api/webhooks/${hook.id}/deliveries?limit=25`, { headers });
      const json = await res.json();
      if (res.ok && json.data) {
        setDeliveries(json.data);
      } else {
        setDeliveries([]);
      }
    } catch (err) {
      console.error("Failed to load deliveries:", err);
      setDeliveries([]);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingHook(null);
    setForm({
      name: "",
      url: "",
      events: ["post.published"],
      secret: "",
      filter: "",
    });
    setFormError(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (hook: WebhookItem) => {
    setEditingHook(hook);
    setForm({
      name: hook.name,
      url: hook.url,
      events: hook.events,
      secret: "",
      filter: hook.filter || "",
    });
    setFormError(null);
    setShowModal(true);
  };

  // Toggle Event Selection
  const toggleEvent = (evt: string) => {
    setForm((prev) => {
      const current = prev.events;
      if (current.includes(evt)) {
        return { ...prev, events: current.filter((e) => e !== evt) };
      }
      return { ...prev, events: [...current, evt] };
    });
  };

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Webhook name is required.");
      return;
    }
    if (!form.url.trim()) {
      setFormError("Payload URL is required.");
      return;
    }
    if (form.events.length === 0) {
      setFormError("Please select at least one event.");
      return;
    }
    if (form.secret && form.secret.length < 16) {
      setFormError("Secret must be at least 16 characters for secure HMAC signing.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (activeProjId) headers["X-OpenPost-Project"] = activeProjId;

      if (editingHook) {
        // PATCH existing webhook
        const body: any = {
          name: form.name.trim(),
          url: form.url.trim(),
          events: form.events,
          filter: form.filter.trim() || null,
        };
        if (form.secret.trim()) {
          body.secret = form.secret.trim();
        }

        const res = await fetch(`/api/webhooks/${editingHook.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || "Failed to update webhook");
        }
      } else {
        // POST new webhook
        const body: any = {
          name: form.name.trim(),
          url: form.url.trim(),
          events: form.events,
          secret: form.secret.trim() || undefined,
          filter: form.filter.trim() || undefined,
          projectId: activeProjId || undefined,
        };

        const res = await fetch("/api/webhooks", {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || "Failed to create webhook");
        }
      }

      setShowModal(false);
      await fetchHooks();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active/Disabled Status
  const toggleActiveStatus = async (hook: WebhookItem) => {
    try {
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (activeProjId) headers["X-OpenPost-Project"] = activeProjId;

      const newStatus = !hook.isActive;
      // Optimistic update
      setHooks((prev) => prev.map((h) => (h.id === hook.id ? { ...h, isActive: newStatus } : h)));

      const res = await fetch(`/api/webhooks/${hook.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!res.ok) {
        // Revert on failure
        setHooks((prev) => prev.map((h) => (h.id === hook.id ? { ...h, isActive: hook.isActive } : h)));
      }
    } catch (err) {
      console.error("Failed to toggle webhook status:", err);
      fetchHooks();
    }
  };

  // Delete Webhook
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const headers: Record<string, string> = {};
      if (activeProjId) headers["X-OpenPost-Project"] = activeProjId;

      const res = await fetch(`/api/webhooks/${deleteTarget.id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "Failed to delete webhook");
      }

      setHooks((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete webhook");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-navy">
              <Webhook className="h-5 w-5 text-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-navy">Webhooks &amp; Automation</h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Trigger HTTP POST payloads to Vercel deploy hooks, Slack, Discord, or your API on content changes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchHooks()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-semibold text-text-secondary hover:bg-slate-50 hover:text-navy transition shadow-xs disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FEA611] px-4 py-2.5 text-xs font-bold text-[#2D3440] hover:bg-[#FE990E] hover:text-white transition shadow-xs"
          >
            <Plus className="h-4 w-4" /> New Webhook
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchHooks()} className="underline hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* Webhooks List */}
      {loading ? (
        <div className="mt-8 flex flex-col items-center justify-center py-20 rounded-2xl border border-border bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="mt-3 text-xs font-semibold text-text-tertiary">Loading configured webhooks...</p>
        </div>
      ) : hooks.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-navy">
            <Webhook className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-navy">No webhooks configured yet</h3>
          <p className="mt-1.5 max-w-md mx-auto text-xs text-text-secondary">
            Connect your decoupled frontend, Vercel on-demand revalidation endpoint, or automation services to trigger whenever posts or taxonomies are published.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FEA611] px-5 py-2.5 text-xs font-bold text-[#2D3440] hover:bg-[#FE990E] hover:text-white transition shadow-xs"
          >
            <Plus className="h-4 w-4" /> Create First Webhook
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {hooks.map((hook) => (
            <div
              key={hook.id}
              className={`rounded-2xl border bg-white p-5 sm:p-6 transition shadow-xs ${
                hook.isActive ? "border-border hover:border-brand/40" : "border-border/60 opacity-75 bg-slate-50/50"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-base font-bold text-navy truncate">{hook.name}</h3>
                    <button
                      type="button"
                      onClick={() => toggleActiveStatus(hook)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold transition ${
                        hook.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                      }`}
                      title="Click to toggle status"
                    >
                      {hook.isActive ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </>
                      ) : (
                        <>
                          <Power className="h-3 w-3" /> Disabled
                        </>
                      )}
                    </button>

                    {hook.secretConfigured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        <Shield className="h-3 w-3" /> HMAC Signed
                      </span>
                    )}
                  </div>

                  <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-text-secondary truncate bg-slate-50 rounded-lg p-2 border border-slate-100 max-w-2xl">
                    <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{hook.url}</span>
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {hook.events.map((e) => (
                      <span
                        key={e}
                        className="rounded-lg bg-navy/5 border border-navy/10 px-2.5 py-1 text-xs font-semibold text-navy"
                      >
                        {e}
                      </span>
                    ))}
                  </div>

                  {hook.filter && (
                    <p className="mt-2 font-mono text-xs text-amber-800 bg-amber-50 rounded-md px-2 py-1 inline-block border border-amber-200">
                      Filter: <span className="font-semibold">{hook.filter}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center sm:self-start gap-1.5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                  <button
                    onClick={() => openDeliveries(hook)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50 transition"
                    title="View delivery logs"
                  >
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Logs</span>
                  </button>

                  <button
                    onClick={() => openEditModal(hook)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white hover:bg-slate-50 text-navy transition"
                    title="Edit webhook"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                  </button>

                  <button
                    onClick={() => setDeleteTarget(hook)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition"
                    title="Delete webhook"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info / Guide Card */}
      <div className="mt-8 rounded-2xl border border-brand/30 bg-gradient-to-br from-amber-50/50 to-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-brand" />
          <h4 className="text-sm font-bold text-navy">Automated Webhooks Delivery Engine</h4>
        </div>
        <ul className="mt-2.5 list-disc pl-5 text-xs text-text-secondary space-y-1.5 leading-relaxed">
          <li>
            <strong className="text-navy">Vercel Deploy Hooks:</strong> Enter your Vercel Build Hook URL (e.g. <code className="bg-white px-1.5 py-0.5 rounded border border-border font-mono text-[11px]">https://api.vercel.com/v1/integrations/deploy/...</code>) with the <code className="bg-white px-1.5 py-0.5 rounded border border-border font-mono text-[11px]">post.published</code> event.
          </li>
          <li>
            <strong className="text-navy">Instant ISR Revalidation:</strong> Send payload to your frontend <code className="bg-white px-1.5 py-0.5 rounded border border-border font-mono text-[11px]">/api/revalidate</code> endpoint to instantly purge cached articles.
          </li>
          <li>
            <strong className="text-navy">HMAC SHA-256 Signatures:</strong> If a secret is provided, payloads include the <code className="bg-white px-1.5 py-0.5 rounded border border-border font-mono text-[11px]">X-OpenPost-Signature</code> header for tamper-proof verification.
          </li>
          <li>
            <strong className="text-navy">Automatic Retries:</strong> Deliveries retry automatically with exponential backoff and record full HTTP status logs.
          </li>
        </ul>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto text-navy">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/15 text-navy">
                  <Webhook className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-navy">
                  {editingHook ? "Edit Webhook" : "Create New Webhook"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Webhook Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vercel Production Deploy Hook, Discord Alerts"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy font-semibold focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Payload URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://yourblog.vercel.app/api/revalidate"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-mono text-navy focus:border-brand focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-text-tertiary">
                  Must be a valid HTTPS URL (HTTP allowed in local dev). Protected against SSRF.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">Subscribed Events *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-border rounded-xl bg-slate-50/50">
                  {AVAILABLE_EVENTS.map((evt) => {
                    const isSelected = form.events.includes(evt.id);
                    return (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => toggleEvent(evt.id)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition text-left border ${
                          isSelected
                            ? "bg-navy text-white border-navy font-semibold"
                            : "bg-white text-text-secondary border-border hover:bg-slate-100 hover:text-navy"
                        }`}
                      >
                        <span>{evt.label}</span>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Secret Key (HMAC SHA-256 Signing, Optional)
                </label>
                <input
                  type="password"
                  placeholder={editingHook?.secretConfigured ? "•••••••••••• (Leave blank to keep current secret)" : "e.g. whsec_32characters..."}
                  value={form.secret}
                  onChange={(e) => setForm({ ...form, secret: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-mono text-navy focus:border-brand focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-text-tertiary">
                  Sent in headers as <code className="font-mono">X-OpenPost-Signature</code> (minimum 16 chars).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  GROQ-like Filter (Optional)
                </label>
                <input
                  type="text"
                  placeholder="category == 'tech' or featured == true"
                  value={form.filter}
                  onChange={(e) => setForm({ ...form, filter: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-mono text-navy focus:border-brand focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-navy hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#FEA611] px-5 py-2 text-xs font-bold text-[#2D3440] hover:bg-[#FE990E] hover:text-white transition disabled:opacity-50 shadow-xs"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingHook ? "Save Changes" : "Create Webhook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl animate-in zoom-in-95 text-navy">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-200">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy">Delete Webhook</h3>
                <p className="text-xs text-text-tertiary">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-text-secondary mt-2">
              Are you sure you want to delete <strong className="text-navy">{deleteTarget.name}</strong>? Automated delivery attempts to this URL will cease immediately.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-navy hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50 shadow-xs"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete Webhook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliveries Logs Drawer / Modal */}
      {activeDeliveryHook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-navy/40 backdrop-blur-xs p-0 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveDeliveryHook(null);
          }}
        >
          <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right text-navy">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand" />
                <div>
                  <h3 className="text-base font-bold text-navy">Delivery Logs</h3>
                  <p className="text-xs text-text-tertiary font-mono truncate max-w-sm">
                    {activeDeliveryHook.name} ({activeDeliveryHook.url})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveDeliveryHook(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loadingDeliveries ? (
                <div className="py-20 text-center">
                  <Loader2 className="h-7 w-7 animate-spin mx-auto text-brand" />
                  <p className="mt-2 text-xs text-text-tertiary">Fetching delivery attempts...</p>
                </div>
              ) : deliveries.length === 0 ? (
                <div className="py-20 text-center rounded-xl border border-dashed border-border bg-slate-50/50 p-6">
                  <Send className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="mt-2 text-xs font-bold text-navy">No deliveries recorded yet</p>
                  <p className="mt-1 text-[11px] text-text-secondary">
                    Deliveries will be logged here whenever a subscribed event occurs (e.g. publishing a blog post).
                  </p>
                </div>
              ) : (
                deliveries.map((del) => (
                  <div
                    key={del.id}
                    className="rounded-xl border border-border p-3.5 bg-slate-50 hover:bg-white hover:border-brand/30 transition text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            del.status === "success"
                              ? "bg-emerald-100 text-emerald-800"
                              : del.status === "failed"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {del.status === "success" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {del.status.toUpperCase()}
                        </span>
                        <span className="font-semibold text-navy">{del.event}</span>
                      </div>
                      <span className="text-[11px] text-text-tertiary">
                        {new Date(del.createdAt).toLocaleTimeString()} · {new Date(del.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {del.lastError && (
                      <p className="mt-2 text-[11px] text-rose-600 bg-rose-50 rounded-lg p-2 border border-rose-100 font-mono">
                        {del.lastError}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between text-[11px] text-text-tertiary border-t border-slate-200/60 pt-2">
                      <span>Attempts: {del.attempts}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedPayload(selectedPayload === del.id ? null : del.id)}
                        className="text-brand font-semibold hover:underline flex items-center gap-0.5"
                      >
                        <FileCode className="h-3 w-3" />
                        {selectedPayload === del.id ? "Hide Payload" : "View Payload"}
                      </button>
                    </div>

                    {selectedPayload === del.id && (
                      <pre className="mt-2 p-2.5 rounded-lg bg-navy text-slate-200 text-[10px] font-mono overflow-x-auto max-h-44">
                        {JSON.stringify(del.payload, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-border bg-slate-50 flex justify-between items-center text-xs">
              <span className="text-text-tertiary">{deliveries.length} recent deliveries</span>
              <button
                onClick={() => openDeliveries(activeDeliveryHook)}
                className="inline-flex items-center gap-1 font-bold text-navy hover:text-brand"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
