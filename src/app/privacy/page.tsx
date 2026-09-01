import { FadeIn } from "@/components/motion";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="overflow-hidden">
      <section className="bg-navy py-16">
        <div className="mx-auto max-w-4xl px-6">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2">
              <Shield className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-semibold text-brand">Privacy Policy</span>
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white">Privacy Policy</h1>
            <p className="mt-4 text-sm text-slate-400">Last updated: August 31, 2026 · OpenPost is open source and privacy-first.</p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-surface py-12">
        <div className="mx-auto max-w-4xl px-6 prose prose-slate max-w-none prose-headings:tracking-tight prose-headings:text-navy prose-a:text-brand">
          <h2>1. What we collect</h2>
          <p>OpenPost self-hosted stores your content in your PostgreSQL database. Cloud version stores: account email, posts, media, and minimal analytics (no tracking cookies, no third-party ads).</p>
          <h2>2. How we use it</h2>
          <p>To provide the CMS, autosave, media processing, and headless API. We never sell data.</p>
          <h2>3. Storage</h2>
          <p>Media stored on Cloudflare R2 (or your S3). Database on Supabase Postgres with daily backups + WAL archiving (RPO 15m).</p>
          <h2>4. Cookies</h2>
          <p>Only essential session cookies + poll dedup cookie. No marketing cookies.</p>
          <h2>5. Your rights</h2>
          <p>Export or delete all data via Settings → Export. Self-hosted: you own the DB, drop it anytime.</p>
          <h2>6. Contact</h2>
          <p>Questions? <a href="/contact">Contact us</a> at hello@openpost.app.</p>
        </div>
      </section>
    </div>
  );
}
