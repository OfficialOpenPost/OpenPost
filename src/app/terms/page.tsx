import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import {
  FileText,
  Scale,
  Mail,
  AlertTriangle,
  Shield,
  Users,
  Lock,
  Globe,
  Heart,
  ScrollText,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const toc = [
  { id: "acceptance", label: "1. Acceptance", icon: Scale },
  { id: "license", label: "2. License (MIT)", icon: FileText },
  { id: "accounts", label: "3. Accounts", icon: Users },
  { id: "content", label: "4. Your content", icon: Heart },
  { id: "acceptable-use", label: "5. Acceptable use", icon: AlertTriangle },
  { id: "ip", label: "6. IP & trademarks", icon: Shield },
  { id: "cloud", label: "7. Cloud service", icon: Globe },
  { id: "self-hosting", label: "8. Self-hosting", icon: Lock },
  { id: "warranty", label: "9. Warranty", icon: AlertTriangle },
  { id: "liability", label: "10. Liability", icon: Scale },
  { id: "termination", label: "12. Termination", icon: FileText },
  { id: "contact", label: "15. Contact", icon: Mail },
];

export default function TermsPage() {
  const lastUpdated = "September 3, 2026";
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-navy overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(254,166,17,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(254,166,17,0.06) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-24">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2">
              <FileText className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-semibold tracking-widest uppercase text-brand">
                Terms of Service
              </span>
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Clear terms,
              <br />
              <span className="text-brand">your content stays yours.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
              MIT-licensed. Self-host free, cloud optional. Plain language — no surprises.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1">
                Last updated: {lastUpdated}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-brand" />
                <a
                  href="mailto:officialopenpost@outlook.com"
                  className="text-brand hover:underline"
                >
                  officialopenpost@outlook.com
                </a>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 text-xs font-bold text-brand">
                MIT License
              </span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Summary */}
      <section className="bg-surface py-8">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <div className="rounded-2xl border border-brand/15 bg-brand/5 p-6 flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-navy">
                <ScrollText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy">Summary</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                  OpenPost is <strong className="text-navy">MIT-licensed</strong>. You own your content.
                  Self-host for free, use cloud as-is. Don&apos;t abuse the service. We provide no
                  warranty and limit liability as permitted by law. Full details below.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Key points */}
      <section className="bg-surface pb-8">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Heart,
                  title: "You own your content",
                  desc: "All rights stay with you. Export anytime, delete anytime. No lock-in.",
                },
                {
                  icon: FileText,
                  title: "MIT licensed",
                  desc: "Use, modify, distribute, sublicense. Fork it, rebrand it, build on it.",
                },
                {
                  icon: Lock,
                  title: "Self-host freely",
                  desc: "Your infrastructure, your rules. No usage fees, no restrictions.",
                },
              ].map((p) => (
                <div
                  key={p.title}
                  className="rounded-xl border border-border bg-white p-5 flex gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <p.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy">{p.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Main layout with TOC */}
      <section className="bg-surface pb-20">
        <div className="mx-auto max-w-6xl px-6 grid gap-8 lg:grid-cols-[240px_1fr] items-start">
          <aside className="hidden lg:block sticky top-24 self-start">
            <div className="rounded-2xl border border-border bg-surface-raised p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-navy">On this page</p>
              <nav className="mt-3 space-y-1">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-white hover:text-navy transition"
                  >
                    <item.icon className="h-3.5 w-3.5 text-text-tertiary" />
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="mt-4 rounded-xl bg-navy p-4 text-white">
                <p className="text-xs font-bold">Have questions?</p>
                <p className="mt-1 text-xs text-slate-400">We reply within 24 hours.</p>
                <a
                  href="mailto:officialopenpost@outlook.com"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-brand px-3 py-2 text-xs font-bold text-navy hover:bg-brand-hover"
                >
                  Email us
                </a>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <Stagger stagger={0.06}>
              <StaggerItem>
                <section
                  id="acceptance"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Scale className="h-4 w-4" />
                    </span>
                    1. Acceptance
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    By accessing{" "}
                    <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-xs">
                      openpost.app
                    </code>
                    , self-hosting, or using the headless API, you agree to these Terms and our{" "}
                    <Link href="/privacy" className="font-semibold text-brand hover:underline">
                      Privacy Policy
                    </Link>
                    . If you act for an organization, you bind it. If you disagree, do not use the
                    service.
                  </p>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="license"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="text-base font-bold text-navy">2. License (MIT)</h2>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    Source is MIT licensed (
                    <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-xs">
                      LICENSE
                    </code>
                    ). You may use, copy, modify, merge, publish, distribute, sublicense, and sell
                    copies, preserving the MIT notice. No trademark grant — &ldquo;OpenPost&rdquo; mark
                    may not be used to imply endorsement without permission.
                  </p>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="accounts"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Users className="h-4 w-4" />
                    </span>
                    3. Accounts &amp; eligibility
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>You must be 16+ and provide accurate email. You keep credentials confidential.</li>
                    <li>
                      We may require verification (
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        REQUIRE_EMAIL_VERIFICATION
                      </code>
                      ) and admin approval (
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        pending → approved
                      </code>
                      ).
                    </li>
                    <li>
                      Roles are per-project{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        OWNER &gt; ADMIN &gt; EDITOR &gt; AUTHOR &gt; CONTRIBUTOR
                      </code>
                      .
                    </li>
                  </ul>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="content"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="text-base font-bold text-navy">4. Your content — you own it</h2>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>
                      You retain all rights. Export anytime via{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        GET /api/v1/posts
                      </code>{" "}
                      or Settings → Export.
                    </li>
                    <li>Limited license to host/serve via API/CDN to operate the service.</li>
                    <li>Trash 30 days then permanent. Self-hosted: you control the DB.</li>
                  </ul>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="acceptable-use"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    5. Acceptable use
                  </h2>
                  <p className="mt-3 text-sm text-text-secondary">You agree not to:</p>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>
                      Upload illegal, infringing, hateful, or non-consensual imagery, spam, malware.
                    </li>
                    <li>
                      Bypass RBAC/RLS, probe{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        Project B
                      </code>{" "}
                      via{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        Project A
                      </code>{" "}
                      (IDOR), or exceed rate limits.
                    </li>
                    <li>Send bulk unsolicited email or scrape at abusive scale.</li>
                  </ul>
                  <p className="mt-3 text-xs text-text-tertiary">
                    We may remove violating content and suspend accounts after review.
                  </p>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="ip"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Shield className="h-4 w-4" />
                    </span>
                    6. IP &amp; trademarks
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    Name, logo (
                    <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-xs">
                      public/logo.svg
                    </code>
                    ), and docs are owned by maintainers. MIT does not grant trademark rights. Fork and
                    rebrand freely, but don&apos;t imply official affiliation.
                  </p>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="cloud"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="text-base font-bold text-navy">7. Cloud service</h2>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>As-is with 99.99% uptime target; maintenance announced.</li>
                    <li>We may throttle abusive tenants.</li>
                    <li>No SLA unless separately agreed.</li>
                  </ul>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="self-hosting"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Lock className="h-4 w-4" />
                    </span>
                    8. Self-hosting
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    Your responsibility (DB, R2, env). We provide{" "}
                    <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                      supabase/migrations 001→019
                    </code>
                    ,{" "}
                    <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                      npm run cms:doctor
                    </code>
                    , and{" "}
                    <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                      cms:bootstrap
                    </code>
                    .
                  </p>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="warranty"
                  className="scroll-mt-28 rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 sm:p-7"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-amber-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    9. Disclaimer of warranty
                  </h2>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-amber-900">
                    OPENPOST IS PROVIDED &ldquo;AS IS&rdquo;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                    IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                    NON-INFRINGEMENT. WE DO NOT WARRANT UNINTERRUPTED OR ERROR-FREE OPERATION. MEDIA
                    PROCESSING AND SCHEDULED PUBLISHING DEPEND ON YOUR INFRASTRUCTURE (R2, CRON_SECRET).
                  </p>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="liability"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="text-base font-bold text-navy">10. Limitation of liability</h2>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    To the maximum extent permitted by law, in no event shall OpenPost, contributors, or
                    licensors be liable for indirect, incidental, special, consequential, or punitive
                    damages, or loss of profits, data, or goodwill, even if advised of possibility. Our
                    aggregate liability for cloud shall not exceed the amount you paid in the 3 months
                    preceding the claim (or $100 if self-hosted free).
                  </p>
                  <h3 className="mt-5 text-sm font-bold text-navy">11. Indemnification</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    You will indemnify OpenPost from claims arising from your content or violation of
                    these Terms or law.
                  </p>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="termination"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="text-base font-bold text-navy">
                    12. Termination · 13. Changes · 14. Governing law
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    Stop using anytime; request deletion via{" "}
                    <a
                      href="mailto:officialopenpost@outlook.com"
                      className="font-semibold text-brand hover:underline"
                    >
                      officialopenpost@outlook.com
                    </a>
                    . We may suspend accounts violating Terms. Material changes posted here with new
                    &ldquo;Last updated&rdquo; date. For cloud disputes, attempt good-faith resolution
                    via email for 30 days before litigation. Self-hosted has no governing law beyond MIT.
                  </p>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="contact"
                  className="scroll-mt-28 rounded-2xl border-2 border-brand/20 bg-brand/5 p-6 sm:p-7"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-navy">
                      <Mail className="h-4 w-4" />
                    </span>
                    15. Contact
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    Questions?{" "}
                    <a
                      href="mailto:officialopenpost@outlook.com"
                      className="font-bold text-brand hover:underline"
                    >
                      officialopenpost@outlook.com
                    </a>{" "}
                    — we reply within 24 hours.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href="mailto:officialopenpost@outlook.com"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-dark"
                    >
                      <Mail className="h-4 w-4" /> Email us
                    </a>
                    <Link
                      href="/privacy"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold hover:bg-surface-raised"
                    >
                      Privacy Policy <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </section>
              </StaggerItem>
            </Stagger>
          </div>
        </div>
      </section>
    </div>
  );
}
