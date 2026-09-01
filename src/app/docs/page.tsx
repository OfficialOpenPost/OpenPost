"use client";

import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { BookOpen, Rocket, Database, Cloud, Terminal, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative bg-gradient-to-br from-[#FEA611]/10 via-white to-white py-12 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FE4F01]/[0.03] via-transparent to-[#FEA611]/[0.03]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 shadow-sm">
              <BookOpen className="h-3.5 w-3.5 text-[#FEA611]" />
              <span className="text-xs font-semibold text-navy">Documentation</span>
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-navy md:text-5xl">Build with OpenPost</h1>
            <p className="mt-4 max-w-2xl text-lg text-text-secondary">Deploy in 5 minutes on Vercel + Supabase + Cloudflare R2, or self-host with Docker. Headless API, structured content, no lock-in. Browse all <code className="font-mono text-xs bg-white border border-border px-1.5 py-0.5 rounded">docs/</code> on the left.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-navy hover:bg-brand-hover">
                Quickstart <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-6 py-3 text-sm font-bold text-slate-300 hover:border-slate-500 hover:text-white">
                Get Help
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="bg-surface py-12">
        <div className="mx-auto max-w-7xl px-6">
          <Stagger className="grid gap-6 md:grid-cols-3" stagger={0.1}>
            {[
              { icon: Rocket, title: "Quickstart", desc: "Create your first post in 2 minutes.", code: "npx create-openpost --template vercel" },
              { icon: Database, title: "Database", desc: "Supabase Postgres + Prisma. JSONB content, FTS via tsvector.", code: "DATABASE_URL=postgresql://..." },
              { icon: Cloud, title: "Media", desc: "R2 presigned uploads + WebP/AVIF variants + CDN.", code: "R2_BUCKET_NAME=openpost-media" },
            ].map((c) => (
              <StaggerItem key={c.title}>
                <div className="rounded-2xl border border-border bg-surface-raised p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-navy">{c.title}</h3>
                  <p className="mt-2 text-sm text-text-secondary">{c.desc}</p>
                  <pre className="mt-4 overflow-x-auto rounded-xl bg-navy p-3 text-xs text-slate-300">{c.code}</pre>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="text-base font-bold text-navy flex items-center gap-2">
                <Terminal className="h-4 w-4 text-brand" /> Deploy to Vercel
              </h3>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-navy p-4 text-xs leading-relaxed text-slate-300">{`git clone https://github.com/your-org/openpost
npm install
cp .env.example .env  # fill DATABASE_URL + R2 + SUPABASE
npx prisma db push
npm run build && vercel --prod`}</pre>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="text-base font-bold text-navy">Self-host with Docker</h3>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-navy p-4 text-xs leading-relaxed text-slate-300">{`docker compose up -d
# compose.yml includes: app (Next.js), db (Postgres), worker (image pipeline)
# Env: DATABASE_URL, R2_*, NEXTAUTH_SECRET`}</pre>
              <p className="mt-4 text-xs text-text-tertiary">See README.md for full compose file and env table.</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-brand/20 bg-brand/5 p-6">
            <p className="text-sm font-bold text-navy">API Reference</p>
            <p className="mt-2 font-mono text-xs text-text-secondary">GET /api/v1/posts · GET /api/v1/posts/:slug · GET /api/v1/categories|tags|authors — all cached, published-only, cursor paginated.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
