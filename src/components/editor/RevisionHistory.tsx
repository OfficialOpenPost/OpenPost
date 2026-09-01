"use client";

import { useEffect, useState } from "react";
import { History, RotateCcw, Clock, Loader2, AlertCircle } from "lucide-react";

interface Revision {
  id: string;
  blogId: string;
  label: string | null;
  createdAt: string;
  createdBy: string;
  content: any;
}

interface RevisionHistoryProps {
  blogId?: string;
  onRestore?: (revision: Revision) => void;
}

export function RevisionHistory({ blogId, onRestore }: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blogId || blogId === "new-post") {
      setRevisions([]);
      return;
    }

    async function loadRevisions() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/blogs/${blogId}/revisions`);
        const json = await res.json();
        if (res.ok && Array.isArray(json.data)) {
          setRevisions(json.data);
        } else {
          setRevisions([]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load revisions");
      } finally {
        setLoading(false);
      }
    }

    loadRevisions();
  }, [blogId]);

  const handleRestore = async (revision: Revision) => {
    if (!blogId) return;
    try {
      setRestoring(true);
      const res = await fetch(`/api/blogs/${blogId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId: revision.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to restore");

      onRestore?.(revision);
    } catch (err: any) {
      alert(err.message || "Failed to restore version");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h3 className="text-sm font-bold text-navy flex items-center gap-2">
        <History className="h-4 w-4 text-brand" /> Revision History
      </h3>
      <p className="mt-1 text-xs text-text-tertiary">
        Automatic snapshots on each publication and edit.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-text-tertiary text-xs gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-brand" /> Loading revisions...
        </div>
      ) : error ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : revisions.length === 0 ? (
        <p className="mt-4 text-xs text-text-tertiary text-center py-4">
          No revision snapshots yet. Save your article to create a checkpoint.
        </p>
      ) : (
        <div className="mt-4 space-y-2 max-h-[320px] overflow-auto pr-1">
          {revisions.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl border p-3 cursor-pointer transition ${
                selected === r.id ? "border-brand bg-brand/5 shadow-xs" : "border-border hover:bg-surface-raised"
              }`}
              onClick={() => setSelected(r.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy">{r.label || "Revision Snapshot"}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-text-tertiary">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              {selected === r.id && (
                <button
                  disabled={restoring}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore(r);
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light transition disabled:opacity-50"
                >
                  {restoring ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                  Restore this version
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
