import { FadeIn } from "@/components/motion";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="overflow-hidden">
      <section className="bg-navy py-16">
        <div className="mx-auto max-w-4xl px-6">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2">
              <FileText className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-semibold text-brand">Terms of Service</span>
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white">Terms of Service</h1>
            <p className="mt-4 text-sm text-slate-400">MIT Licensed · Self-host free, cloud optional.</p>
          </FadeIn>
        </div>
      </section>
      <section className="bg-surface py-12">
        <div className="mx-auto max-w-4xl px-6 prose prose-slate max-w-none prose-headings:text-navy prose-a:text-brand">
          <h2>1. License</h2>
          <p>OpenPost is MIT licensed. You may use, modify, and self-host commercially.</p>
          <h2>2. Cloud Service</h2>
          <p>Cloud offering is provided as-is with 99.99% uptime target. Abuse, spam, or illegal content may be removed.</p>
          <h2>3. Content Ownership</h2>
          <p>You own your content. Structured JSON export is always available. No vendor lock-in.</p>
          <h2>4. Media</h2>
          <p>Uploaded media is processed to WebP/AVIF and served via CDN. Don’t upload illegal or copyrighted material you don’t own.</p>
          <h2>5. Limitation of Liability</h2>
          <p>Service provided without warranty. Not liable for indirect damages.</p>
        </div>
      </section>
    </div>
  );
}
