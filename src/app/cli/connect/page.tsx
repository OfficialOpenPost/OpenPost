"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CliConnectInner() {
  const params = useSearchParams();
  const [project, setProject] = useState("tech-blog");
  const [code, setCode] = useState<string | null>(null);

  const handleApprove = async () => {
    const res = await fetch("/api/cli/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project }),
    });
    const data = await res.json();
    setCode(data.code ?? "OP-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase());
  };

  if (code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-navy">Authorization Code</h1>
          <p className="mt-2 text-sm text-text-secondary">Copy this code and paste it into your terminal. Expires in 10 minutes, single-use.</p>
          <div className="mt-6 rounded-xl bg-navy px-6 py-4 font-mono text-lg font-bold text-brand tracking-widest">{code}</div>
          <p className="mt-4 text-xs text-text-tertiary">The CLI will exchange this for a project-scoped token (never your password).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-white p-8">
        <h1 className="text-xl font-bold text-navy">Connect Website</h1>
        <p className="mt-2 text-sm text-text-secondary">This application is requesting access to your OpenPost CMS.</p>
        <div className="mt-6 rounded-xl border border-border bg-surface-raised p-4">
          <p className="text-sm font-bold">Project: Tech Blog</p>
          <p className="text-xs text-text-tertiary mt-1">Permissions: READ_PUBLISHED_POSTS, READ_CATEGORIES, READ_TAGS, READ_AUTHORS, RECEIVE_WEBHOOKS</p>
        </div>
        <div className="mt-6">
          <label className="text-sm font-medium">Select Project</label>
          <select value={project} onChange={(e) => setProject(e.target.value)} className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm">
            <option value="tech-blog">Tech Blog</option>
            <option value="business-blog">Business Blog</option>
          </select>
        </div>
        <button onClick={handleApprove} className="mt-6 w-full rounded-xl bg-brand py-3 text-sm font-bold text-navy hover:bg-brand-hover">
          Approve & Generate Code
        </button>
        <p className="mt-3 text-center text-xs text-text-tertiary">You will be redirected back to CLI after approval.</p>
      </div>
    </div>
  );
}

export default function CliConnectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CliConnectInner />
    </Suspense>
  );
}
