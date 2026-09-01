import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { CheckCircle2, Clock, Sparkles } from "lucide-react";

const PHASES = [
  { phase: "V1 — Core Editor", status: "done", items: ["Tiptap", "Autosave", "Preview", "Publish"] },
  { phase: "V2 — CMS Layer", status: "done", items: ["Dashboard", "SEO", "Scheduling", "API", "Webhooks"] },
  { phase: "V3 — Advanced Blocks", status: "next", items: ["Slash menu", "Poll", "Gallery", "FAQ", "Embeds"] },
  { phase: "V4 — Media Pipeline", status: "planned", items: ["R2 variants", "WebP/AVIF", "Media library"] },
];

export default function RoadmapPage() {
  return (
    <div className="overflow-hidden">
      <section className="bg-navy py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h1 className="text-4xl font-bold tracking-tight text-white">Roadmap</h1>
          <p className="mt-4 text-slate-400">V1–V4 shipped incrementally, each independently useful.</p>
        </div>
      </section>
      <section className="bg-surface py-12">
        <div className="mx-auto max-w-4xl px-6">
          <Stagger className="grid gap-6 md:grid-cols-2" stagger={0.1}>
            {PHASES.map((p) => (
              <StaggerItem key={p.phase}>
                <div className={`rounded-2xl border p-6 ${p.status === "done" ? "border-success/20 bg-success/5" : p.status === "next" ? "border-brand/20 bg-brand/5" : "border-border bg-surface-raised"}`}>
                  <div className="flex items-center gap-2">
                    {p.status === "done" ? <CheckCircle2 className="h-5 w-5 text-success" /> : p.status === "next" ? <Clock className="h-5 w-5 text-brand" /> : <Sparkles className="h-5 w-5 text-text-tertiary" />}
                    <h2 className="text-base font-bold text-navy">{p.phase}</h2>
                    <span className={`ml-auto rounded-full px-2 py-1 text-xs font-semibold capitalize ${p.status === "done" ? "bg-success text-white" : p.status === "next" ? "bg-brand text-navy" : "bg-surface border border-border text-text-tertiary"}`}>{p.status}</span>
                  </div>
                  <ul className="mt-4 list-disc pl-5 text-sm text-text-secondary space-y-1">
                    {p.items.map((it) => (
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
