"use client";
import { useState, useEffect } from "react";
import { Shield, Search, Clock } from "lucide-react";

interface Log {
  id: string;
  action: string;
  actorId: string | null;
  targetId: string | null;
  metadata: any;
  createdAt: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try { setProjectId(localStorage.getItem("openpost_active_project_id")); } catch {}
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const pid = localStorage.getItem("openpost_active_project_id");
      const params = new URLSearchParams();
      if (pid) params.set("projectId", pid);
      if (actionFilter) params.set("action", actionFilter);
      const res = await fetch(`/api/audit?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to fetch audit logs");
      setLogs(json.data || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);
  // refetch on action filter debounced
  useEffect(() => { const t=setTimeout(fetchLogs, 400); return ()=>clearTimeout(t); }, [actionFilter]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-navy text-white flex items-center justify-center"><Shield className="h-5 w-5" /></div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Audit Logs</h1>
          <p className="text-sm text-text-secondary">Security-sensitive events: approvals, role changes, publishing, author linking, invites.</p>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} placeholder="Filter by action (e.g. author.created)" className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm focus:border-brand focus:outline-none" />
        </div>
        <button onClick={fetchLogs} className="rounded-xl bg-navy text-white px-4 py-2 text-sm font-bold hover:bg-navy/90">Refresh</button>
      </div>

      {error && <p className="mt-4 rounded-xl bg-flame/10 p-3 text-sm text-flame">{error}</p>}

      <div className="mt-6 rounded-2xl border border-border bg-white overflow-hidden">
        {loading ? <p className="p-8 text-center text-sm text-text-tertiary">Loading…</p> : logs.length === 0 ? <p className="p-8 text-center text-sm text-text-tertiary">No audit events found.</p> : (
          <div className="divide-y divide-border">
            {logs.map((l) => (
              <div key={l.id} className="p-4 flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-brand/20 flex items-center justify-center shrink-0"><Clock className="h-4 w-4 text-navy" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-navy">{l.action} <span className="font-normal text-text-tertiary">· {new Date(l.createdAt).toLocaleString()}</span></p>
                  <p className="text-xs font-mono text-text-tertiary mt-1">actor: {l.actorId || "system"} · target: {l.targetId || "-"}</p>
                  {l.metadata && Object.keys(l.metadata).length > 0 && <pre className="mt-1 text-[11px] bg-surface-raised p-2 rounded-lg overflow-auto">{JSON.stringify(l.metadata, null, 2)}</pre>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
