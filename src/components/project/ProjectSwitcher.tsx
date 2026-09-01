"use client";

import { useState } from "react";
import Link from "next/link";

export function ProjectSwitcher({ projects, currentId }: { projects: { id: string; name: string }[]; currentId?: string }) {
  const [open, setOpen] = useState(false);
  const current = projects.find((p) => p.id === currentId) ?? projects[0];

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold">
        <span className="h-2 w-2 rounded-full bg-brand" /> {current?.name ?? "Select project"} ▼
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-20 w-56 rounded-xl border border-border bg-white shadow-xl">
          {projects.map((p) => (
            <Link key={p.id} href={`/dashboard?project=${p.id}`} className="block px-3 py-2 text-sm hover:bg-surface-raised">
              {p.name}
            </Link>
          ))}
          <Link href="/dashboard/projects/new" className="block px-3 py-2 text-sm font-bold text-brand border-t border-border">
            + New Project
          </Link>
        </div>
      )}
    </div>
  );
}
