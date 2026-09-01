import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const ENTRIES = [
  { version: "v0.2.0", date: "2026-08-30", title: "Stage 2 — CMS Layer", items: ["Blog list with filters & pagination", "Categories/Tags/Authors CRUD", "SEO panel + featured image", "Scheduled publishing + webhooks"] },
  { version: "v0.1.0", date: "2026-08-28", title: "Stage 1 — Core Editor", items: ["Tiptap editor + toolbar + bubbles", "Autosave + IndexedDB recovery", "Preview + publish flow", "Supabase + R2 integration"] },
];

export default function ChangelogPage() {
  return (
    <div className="overflow-hidden">
      <section className="bg-navy py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h1 className="text-4xl font-bold tracking-tight text-white">Changelog</h1>
          <p className="mt-4 text-slate-400">All notable changes to OpenPost.</p>
        </div>
      </section>
      <section className="bg-surface py-12">
        <div className="mx-auto max-w-4xl px-6">
          <Stagger className="space-y-8" stagger={0.1}>
            {ENTRIES.map((e) => (
              <StaggerItem key={e.version}>
                <div className="rounded-2xl border border-border bg-surface-raised p-6">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-navy">{e.version}</span>
                    <span className="text-xs text-text-tertiary">{e.date}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-navy">{e.title}</h2>
                  <ul className="mt-3 list-disc pl-5 text-sm text-text-secondary space-y-1">
                    {e.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </div>
  );
}
