"use client";

import { Check, Loader2, AlertCircle, CloudOff } from "lucide-react";

type Status = "saved" | "saving" | "unsaved" | "error";

export function StatusIndicator({ status }: { status: Status }) {
  const map: Record<Status, { icon: React.ReactNode; label: string; className: string }> = {
    saved: { icon: <Check className="h-3.5 w-3.5" />, label: "Saved", className: "text-success bg-success/10 border-success/20" },
    saving: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, label: "Saving…", className: "text-brand bg-brand/10 border-brand/20" },
    unsaved: { icon: <CloudOff className="h-3.5 w-3.5" />, label: "Unsaved", className: "text-text-tertiary bg-surface-raised border-border" },
    error: { icon: <AlertCircle className="h-3.5 w-3.5" />, label: "Unable to save", className: "text-flame bg-flame/10 border-flame/20" },
  };

  const s = map[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${s.className}`}>
      {s.icon} {s.label}
    </span>
  );
}
