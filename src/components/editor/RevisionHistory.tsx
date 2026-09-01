"use client";

import { useState } from "react";
import { History, RotateCcw, Clock, User } from "lucide-react";

interface Revision {
  id: string;
  label: string;
  createdAt: string;
  author: string;
  wordCount: number;
}

const MOCK_REVISIONS: Revision[] = [
  { id: "3", label: "Published", createdAt: "2026-08-30T10:00:00Z", author: "Priya", wordCount: 1247 },
  { id: "2", label: "Auto-checkpoint", createdAt: "2026-08-30T09:45:00Z", author: "Priya", wordCount: 1201 },
  { id: "1", label: "Manual save", createdAt: "2026-08-29T18:30:00Z", author: "Priya", wordCount: 892 },
];

export function RevisionHistory({ onRestore }: { onRestore?: (id: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h3 className="text-sm font-bold text-navy flex items-center gap-2">
        <History className="h-4 w-4 text-brand" /> Revision History
      </h3>
      <p className="mt-1 text-xs text-text-tertiary">50 checkpoints / 90 days retention. Restore loads into draft.</p>

      <div className="mt-4 space-y-2 max-h-[320px] overflow-auto pr-1">
        {MOCK_REVISIONS.map((r) => (
          <div key={r.id} className={`rounded-xl border p-3 cursor-pointer transition ${selected === r.id ? "border-brand bg-brand/5" : "border-border hover:bg-surface-raised"}`} onClick={() => setSelected(r.id)}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy">{r.label}</span>
              <span className="text-xs text-text-tertiary">{r.wordCount} words</span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-text-tertiary">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {new Date(r.createdAt).toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3" /> {r.author}
              </span>
            </div>
            {selected === r.id && (
              <button onClick={() => onRestore?.(r.id)} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light">
                <RotateCcw className="h-3 w-3" /> Restore this version
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-text-tertiary">Diff: word-count delta + &quot;N blocks changed&quot; summary (best-effort).</p>
    </div>
  );
}
