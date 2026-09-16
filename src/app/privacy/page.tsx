import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import {
  Shield,
  Mail,
  Database,
  Cookie,
  Eye,
  Lock,
  UserCheck,
  Globe,
  FileText,
  Clock,
  Heart,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const toc = [
  { id: "who-we-are", label: "1. Who we are", icon: Shield },
  { id: "what-we-collect", label: "2. What we collect", icon: Eye },
  { id: "how-we-use", label: "3. How we use", icon: FileText },
  { id: "where-data-lives", label: "4. Where data lives", icon: Lock },
  { id: "cookies", label: "5. Cookies", icon: Cookie },
  { id: "retention", label: "6. Retention", icon: Clock },
  { id: "your-rights", label: "7. Your rights", icon: UserCheck },
  { id: "security", label: "8. Security", icon: Lock },
  { id: "transfers", label: "9. Transfers", icon: Globe },
  { id: "children", label: "10. Children", icon: Heart },
  { id: "changes", label: "11. Changes", icon: FileText },
  { id: "contact", label: "12. Contact", icon: Mail },
];

export default function PrivacyPage() {
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
              <Shield className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-semibold tracking-widest uppercase text-brand">
                Privacy Policy
              </span>
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Privacy that respects
              <br />
              <span className="text-brand">your ownership.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
              OpenPost is privacy-first and data-minimal. Self-hosted keeps everything in your
              infrastructure. Cloud collects only what is needed to run the CMS.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1">
                <Clock className="h-3 w-3" /> Last updated: {lastUpdated}
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
            </div>
          </FadeIn>
        </div>
      </section>

      {/* TL;DR */}
      <section className="bg-surface py-8">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <div className="rounded-2xl border border-brand/15 bg-brand/5 p-6 flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-navy">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy">TL;DR</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                  Self-hosted OpenPost keeps all content in{" "}
                  <strong className="text-navy">your</strong> Postgres &amp; R2 bucket — we never see
                  it. Cloud OpenPost stores only what is needed (account email, posts, media, session
                  cookies). No ads, no tracking pixels, no data selling. Export &amp; delete in one click.
                  Questions?{" "}
                  <a
                    href="mailto:officialopenpost@outlook.com"
                    className="text-brand hover:underline font-semibold"
                  >
                    officialopenpost@outlook.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Key principles */}
      <section className="bg-surface pb-8">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Lock,
                  title: "No tracking",
                  desc: "No advertising IDs, no cross-site tracking, no third-party marketing profiles.",
                },
                {
                  icon: Database,
                  title: "Minimal collection",
                  desc: "Only what's needed: your email, your posts, your media. Nothing more.",
                },
                {
                  icon: CheckCircle2,
                  title: "Full control",
                  desc: "Export everything, delete everything, self-host everything. Your data, your rules.",
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
          {/* TOC — sticky on desktop */}
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
                <p className="text-xs font-bold">Need help?</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  We reply within 24 hours.
                </p>
                <a
                  href="mailto:officialopenpost@outlook.com"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-brand px-3 py-2 text-xs font-bold text-navy hover:bg-brand-hover"
                >
                  Email us
                </a>
              </div>
            </div>
          </aside>

          {/* Content cards */}
          <div className="space-y-6">
            <Stagger stagger={0.06}>
              <StaggerItem>
                <section
                  id="who-we-are"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Database className="h-4 w-4" />
                    </span>
                    1. Who we are
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    <strong className="text-navy">OpenPost</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is
                    an open-source headless CMS. Self-hosted deployments are operated by you. Cloud
                    deployments are operated by the OpenPost team. This policy applies to{" "}
                    <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-xs">
                      openpost.app
                    </code>
                    , the dashboard, and the headless API. Controller contact:{" "}
                    <a
                      href="mailto:officialopenpost@outlook.com"
                      className="font-semibold text-brand hover:underline"
                    >
                      officialopenpost@outlook.com
                    </a>
                    .
                  </p>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="what-we-collect"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Eye className="h-4 w-4" />
                    </span>
                    2. What we collect
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        title: "Account",
                        desc: "Email, display name, password hash (Supabase Auth), profile status (pending/approved)",
                      },
                      {
                        title: "Content you create",
                        desc: "Posts (structured JSON), categories/tags/authors, media metadata, revisions, audit logs",
                      },
                      {
                        title: "Media",
                        desc: "Original filename, MIME, size, dimensions, checksum — file bytes live in your R2/S3 bucket",
                      },
                      {
                        title: "Usage (minimal)",
                        desc: "Session cookie, poll dedup cookie, API logs (IP, user-agent, timestamp) for abuse prevention",
                      },
                    ].map((c) => (
                      <div
                        key={c.title}
                        className="rounded-xl border border-border bg-surface-raised p-4"
                      >
                        <p className="text-sm font-bold text-navy">{c.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-text-secondary">{c.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    We <strong>do not</strong> collect advertising IDs, cross-site tracking, or
                    third-party marketing profiles.
                  </p>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="how-we-use"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="text-base font-bold text-navy">
                    3. How we use it &amp; legal basis
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>
                      <strong className="text-navy">Provide the service</strong> — create/edit/publish
                      posts, manage team, serve API (contract).
                    </li>
                    <li>
                      <strong className="text-navy">Security &amp; abuse prevention</strong> — rate
                      limiting, SSRF blocking, audit logs (legitimate interest).
                    </li>
                    <li>
                      <strong className="text-navy">Communication</strong> — reply at{" "}
                      <a
                        href="mailto:officialopenpost@outlook.com"
                        className="text-brand hover:underline"
                      >
                        officialopenpost@outlook.com
                      </a>{" "}
                      (consent/contract).
                    </li>
                    <li>
                      <strong className="text-navy">Legal compliance</strong> — retention for tax/audit
                      where required.
                    </li>
                  </ul>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="where-data-lives"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Lock className="h-4 w-4" />
                    </span>
                    4. Where data lives &amp; who processes it
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>
                      <strong className="text-navy">Self-hosted:</strong> 100% in your infrastructure
                      (your Postgres + R2). We have no access.
                    </li>
                    <li>
                      <strong className="text-navy">Cloud:</strong> Supabase (Postgres + Auth, EU/US),
                      Cloudflare R2 (media), Vercel (hosting). Each is a sub-processor with DPA.
                    </li>
                    <li>
                      Backups: daily full + WAL archiving (RPO &le;15m, RTO &le;2h). Media inherits R2
                      durability (11 nines).
                    </li>
                  </ul>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="cookies"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Cookie className="h-4 w-4" />
                    </span>
                    5. Cookies
                  </h2>
                  <p className="mt-3 text-sm text-text-secondary">
                    Essential only — no marketing cookies, no consent banner needed:
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
                      <p className="font-mono text-xs font-bold text-navy">sb-*</p>
                      <p className="mt-1 text-xs text-text-secondary">
                        Supabase session — httpOnly, Secure, SameSite=Lax
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
                      <p className="font-mono text-xs font-bold text-navy">op_poll_voter</p>
                      <p className="mt-1 text-xs text-text-secondary">
                        Poll deduplication — 1 year, httpOnly
                      </p>
                    </div>
                  </div>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="retention"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="text-base font-bold text-navy">6. Data retention</h2>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>Active account: until deletion.</li>
                    <li>Trash: 30 days (configurable) then permanent delete.</li>
                    <li>Audit logs: 1 year.</li>
                    <li>Backups: 30 days rolling, then purged.</li>
                    <li>
                      On deletion: profile + memberships removed, posts reassigned or anonymized per your
                      choice.
                    </li>
                  </ul>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="your-rights"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <UserCheck className="h-4 w-4" />
                    </span>
                    7. Your rights (GDPR/DPDP)
                  </h2>
                  <p className="mt-3 text-sm text-text-secondary">You may at any time:</p>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>
                      <strong className="text-navy">Access &amp; export</strong> — Settings &rarr; Export
                      (JSON) or{" "}
                      <a
                        href="mailto:officialopenpost@outlook.com"
                        className="text-brand hover:underline"
                      >
                        officialopenpost@outlook.com
                      </a>
                      .
                    </li>
                    <li>
                      <strong className="text-navy">Correction &amp; deletion</strong> — edit profile,
                      delete posts/media, or request erasure.
                    </li>
                    <li>
                      <strong className="text-navy">Portability</strong> — structured JSON export of all
                      posts + media manifest.
                    </li>
                  </ul>
                  <p className="mt-3 text-xs text-text-tertiary">
                    We respond within 30 days. Self-hosted admins can run SQL directly.
                  </p>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="security"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="text-base font-bold text-navy">8. Security</h2>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>Passwords: bcrypt/Argon2 via Supabase Auth (never plaintext).</li>
                    <li>Encryption: TLS 1.2+ in transit, AES-256 at rest.</li>
                    <li>
                      Isolation: RLS{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        project_members.user_id = auth.uid()
                      </code>{" "}
                      + app-layer{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        requireProjectMember(projectId)
                      </code>
                      .
                    </li>
                    <li>
                      Media: magic-byte validation, server keys{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        openpost-media/&lt;projectId&gt;/&lt;uuid&gt;
                      </code>
                      .
                    </li>
                  </ul>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section
                  id="transfers"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Globe className="h-4 w-4" />
                    </span>
                    9. International transfers
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    Cloud data may be processed in US/EU per your Supabase region. We rely on SCCs and
                    provider DPAs. Self-hosted has no transfer.
                  </p>
                </section>
              </StaggerItem>

              <StaggerItem>
                <section className="rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm">
                  <h2 className="text-base font-bold text-navy">
                    10. Children &amp; 11. Changes
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    Not directed to under-16s. Material changes announced via dashboard banner and email.
                    Version history kept in Git.
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
                    12. Contact
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    Questions, requests, or complaints:{" "}
                    <a
                      href="mailto:officialopenpost@outlook.com"
                      className="font-bold text-brand hover:underline"
                    >
                      officialopenpost@outlook.com
                    </a>
                    . We acknowledge within 24 hours. You may also lodge a complaint with your local DPA.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href="mailto:officialopenpost@outlook.com"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-dark"
                    >
                      <Mail className="h-4 w-4" /> Email us
                    </a>
                    <Link
                      href="/terms"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold hover:bg-surface-raised"
                    >
                      Terms of Service <ExternalLink className="h-3.5 w-3.5" />
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
