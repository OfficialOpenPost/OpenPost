"use client";

import { useState, useEffect, Suspense } from "react";
import { Copy, Check, Terminal, Shield, Clock, AlertCircle, Loader2 } from "lucide-react";

function CliConnectInner() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingProjects, setFetchingProjects] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        setFetchingProjects(true);
        const res = await fetch("/api/projects");
        const json = await res.json();
        if (res.ok && Array.isArray(json.data) && json.data.length > 0) {
          setProjects(json.data);
          setSelectedProjectId(json.data[0].id);
        } else if (res.status === 401) {
          setError("Please sign in to your OpenPost account first to authorize the CLI.");
        } else {
          setError("No active website projects found. Please create a project first.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load projects");
      } finally {
        setFetchingProjects(false);
      }
    }

    loadProjects();
  }, []);

  const handleApprove = async () => {
    if (!selectedProjectId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/cli/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to generate authorization code.");
      }

      setCode(json.code);
      setExpiresAt(json.expiresAt);
    } catch (err: any) {
      setError(err.message || "Failed to generate code");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dim p-6">
        <div className="max-w-md w-full rounded-3xl border border-border bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/20 text-navy mb-4">
            <Terminal className="h-7 w-7 text-navy" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-navy">CLI Authorization Code</h1>
          <p className="mt-2 text-xs text-text-secondary">
            Paste this one-time code into your terminal prompt to complete the setup.
          </p>

          <div className="mt-6 relative rounded-2xl bg-navy p-5 font-mono text-xl font-bold text-brand tracking-widest flex items-center justify-center gap-3 select-all shadow-inner">
            <span>{code}</span>
          </div>

          <button
            onClick={handleCopy}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white py-2.5 text-xs font-bold text-navy hover:bg-surface-dim transition"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied to Clipboard!" : "Copy Authorization Code"}
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl py-2 px-3 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            <span>Valid for 10 minutes &bull; Single-use only</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dim p-6">
      <div className="max-w-md w-full rounded-3xl border border-border bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/20 text-navy">
            <Terminal className="h-6 w-6 text-navy" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-navy">Connect OpenPost CLI</h1>
            <p className="text-xs text-text-secondary">Authorize a local blog frontend starter</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-surface-dim/60 p-4 space-y-2 mb-5">
          <div className="flex items-center gap-2 text-xs font-bold text-navy">
            <Shield className="h-3.5 w-3.5 text-emerald-600" />
            <span>Requested Scopes</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed font-mono">
            READ_PUBLISHED_POSTS, READ_CATEGORIES, READ_TAGS, READ_AUTHORS, RECEIVE_WEBHOOKS
          </p>
        </div>

        {fetchingProjects ? (
          <div className="py-8 flex items-center justify-center gap-2 text-xs text-text-tertiary">
            <Loader2 className="h-4 w-4 animate-spin text-brand" /> Loading websites...
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">Select Website / Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-xs font-semibold text-navy focus:border-brand focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.slug})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleApprove}
              disabled={loading || projects.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-xs font-bold text-navy hover:bg-brand-hover hover:text-white transition shadow-xs disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Approve &amp; Generate Authorization Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CliConnectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface-dim">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      }
    >
      <CliConnectInner />
    </Suspense>
  );
}
