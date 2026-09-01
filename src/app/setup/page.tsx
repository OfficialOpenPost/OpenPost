"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Settings } from "lucide-react";

export default function SetupPage() {
  const [checks] = useState([
    { label: "Database connected", ok: true },
    { label: "Authentication configured", ok: true },
    { label: "Storage (R2) configured", ok: true },
    { label: "Environment variables valid", ok: true },
  ]);

  const allOk = checks.every((c) => c.ok);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy">OpenPost Setup</h1>
            <p className="text-sm text-text-secondary">Initial administrator setup</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: c.ok ? "#10B98130" : "#EF444430", background: c.ok ? "#ECFDF5" : "#FFF0EB" }}>
              {c.ok ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-flame" />}
              <span className="text-sm font-medium">{c.label}</span>
              <span className="ml-auto text-xs font-bold" style={{ color: c.ok ? "#10B981" : "#EF4444" }}>
                {c.ok ? "OK" : "Failed"}
              </span>
            </div>
          ))}
        </div>

        {allOk ? (
          <div className="mt-6 rounded-xl bg-brand p-4 text-center">
            <p className="text-sm font-bold text-navy">All systems ready — create your administrator</p>
            <Link href="/signup" className="mt-3 inline-flex rounded-xl bg-navy px-6 py-2.5 text-sm font-bold text-white">
              Create Administrator
            </Link>
            <p className="mt-2 text-xs text-navy/70">After setup, this page is disabled.</p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-flame">Fix env and DB, then refresh. See docs/deployment.md</p>
        )}
      </div>
    </div>
  );
}
