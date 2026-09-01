"use client";

import { useState } from "react";
import { Plus, Webhook, Globe, Shield, Trash2, Edit3, X, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface Hook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string | null;
  filter: string | null;
  isActive: boolean;
}

const INITIAL: Hook[] = [];

const ALL_EVENTS = ["post.publish", "post.update", "post.delete", "post.scheduled", "post.unpublish"];

export default function WebhooksPage() {
  const [hooks, setHooks] = useState<Hook[]>(INITIAL);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<Hook>>({ name: "", url: "", events: [], secret: "", filter: "" });

  const handleSave = () => {
    if (!form.name || !form.url || !form.events?.length) return;
    const payload: Hook = {
      id: Date.now().toString(),
      name: form.name!,
      url: form.url!,
      events: form.events!,
      secret: form.secret || null,
      filter: form.filter || null,
      isActive: true,
    };
    setHooks((prev) => [...prev, payload]);
    setShowModal(false);
    setForm({ name: "", url: "", events: [], secret: "", filter: "" });
  };

  const toggleEvent = (evt: string) => {
    const events = form.events ?? [];
    setForm({ ...form, events: events.includes(evt) ? events.filter((e) => e !== evt) : [...events, evt] });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy flex items-center gap-2">
            <Webhook className="h-6 w-6 text-brand" /> Webhooks
          </h1>
          <p className="mt-1 text-sm text-text-secondary">Like Sanity — trigger HTTP POST on publish, update, delete with HMAC signing and retries.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy hover:bg-brand-hover transition">
          <Plus className="h-4 w-4" /> New Webhook
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        {hooks.map((hook) => (
          <div key={hook.id} className="rounded-2xl border border-border bg-surface p-6 h-[220px] flex flex-col hover:border-brand/20 transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-navy">{hook.name}</h3>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${hook.isActive ? "bg-success/10 text-success" : "bg-surface-raised text-text-tertiary"}`}>
                    {hook.isActive ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />} {hook.isActive ? "Active" : "Disabled"}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-text-secondary truncate">
                  <Globe className="h-3 w-3" /> {hook.url}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {hook.events.map((e) => (
                    <span key={e} className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                      {e}
                    </span>
                  ))}
                </div>
                {hook.filter && <p className="mt-2 font-mono text-xs text-orange">filter: {hook.filter} (GROQ-like)</p>}
                {hook.secret && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-text-tertiary">
                    <Shield className="h-3 w-3" /> Signed with HMAC SHA256
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-raised">
                  <Edit3 className="h-4 w-4 text-text-secondary" />
                </button>
                <button onClick={() => setHooks((prev) => prev.filter((h) => h.id !== hook.id))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-flame/10 text-flame">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-text-tertiary">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> Last delivery: 2 min ago — 200 OK
              </span>
              <span>Retries: 3</span>
            </div>
          </div>
        ))}
      </div>

      {hooks.length === 0 && <p className="py-12 text-center text-sm text-text-tertiary">No webhooks yet. Create one to trigger on publish/update/delete.</p>}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy">New Webhook</h2>
              <button onClick={() => setShowModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-raised">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-text-primary">Name</label>
                <input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Vercel Deploy" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary">Payload URL</label>
                <input value={form.url ?? ""} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 font-mono text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary">Events</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ALL_EVENTS.map((evt) => (
                    <button
                      key={evt}
                      type="button"
                      onClick={() => toggleEvent(evt)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${form.events?.includes(evt) ? "bg-navy text-white border-navy" : "bg-surface border-border text-text-secondary hover:bg-surface-raised"}`}
                    >
                      {evt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary">Secret (HMAC signing, optional)</label>
                <input value={form.secret ?? ""} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder="whsec_..." className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 font-mono text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                <p className="mt-1 text-xs text-text-tertiary">Sent as X-OpenPost-Signature (hex HMAC SHA256)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary">Filter (GROQ-like, optional)</label>
                <input value={form.filter ?? ""} onChange={(e) => setForm({ ...form, filter: e.target.value })} placeholder="category == 'seo'" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 font-mono text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                <p className="mt-1 text-xs text-text-tertiary">Only deliver when filter matches, e.g. category == &#39;seo&#39;</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-raised">
                Cancel
              </button>
              <button onClick={handleSave} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy hover:bg-brand-hover">
                Create Webhook
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-brand/20 bg-brand/5 p-4">
        <p className="text-sm font-bold text-navy">How it works (like Sanity)</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-text-secondary space-y-1">
          <li>POST JSON to your URL on selected events with X-OpenPost-Event + X-OpenPost-Signature headers</li>
          <li>Retries 3 times with backoff, logs deliveries in webhook_deliveries</li>
          <li>Filter with GROQ-like `field == &#39;value&#39;` (extensible to full GROQ)</li>
          <li>Trigger a Vercel deploy hook, Slack, or your own API — headless, no vendor lock-in</li>
        </ul>
      </div>
    </div>
  );
}
