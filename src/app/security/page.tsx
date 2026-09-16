import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  Globe,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Key,
  Upload,
  BarChart3,
  Server,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const toc = [
  { id: "rls", label: "1. Row-Level Security", icon: Lock },
  { id: "rbac", label: "2. RBAC Matrix", icon: Shield },
  { id: "ssrf", label: "3. SSRF Protection", icon: Globe },
  { id: "xss", label: "4. XSS Prevention", icon: Eye },
  { id: "api-tokens", label: "5. API Token Security", icon: Key },
  { id: "file-upload", label: "6. File Upload Security", icon: Upload },
  { id: "polls", label: "7. Voter Fraud Prevention", icon: BarChart3 },
  { id: "rate-limiting", label: "8. Rate Limiting", icon: Clock },
  { id: "env-security", label: "9. Env Variable Security", icon: Server },
  { id: "audit-results", label: "10. Audit Results", icon: CheckCircle2 },
  { id: "disclosure", label: "11. Responsible Disclosure", icon: Mail },
];

const rbacPermissions = [
  { permission: "project.view", owner: true, admin: true, editor: true, author: true, contributor: true },
  { permission: "project.update", owner: true, admin: true, editor: false, author: false, contributor: false },
  { permission: "project.delete", owner: true, admin: false, editor: false, author: false, contributor: false },
  { permission: "members.view", owner: true, admin: true, editor: true, author: false, contributor: false },
  { permission: "members.invite", owner: true, admin: true, editor: false, author: false, contributor: false },
  { permission: "members.suspend", owner: true, admin: true, editor: false, author: false, contributor: false },
  { permission: "members.remove", owner: true, admin: true, editor: false, author: false, contributor: false },
  { permission: "authors.view", owner: true, admin: true, editor: true, author: true, contributor: true },
  { permission: "authors.create", owner: true, admin: true, editor: true, author: false, contributor: false },
  { permission: "authors.delete", owner: true, admin: true, editor: false, author: false, contributor: false },
  { permission: "posts.create", owner: true, admin: true, editor: true, author: true, contributor: true },
  { permission: "posts.edit_own", owner: true, admin: true, editor: true, author: true, contributor: true },
  { permission: "posts.edit_others", owner: true, admin: true, editor: true, author: false, contributor: false },
  { permission: "posts.delete_own", owner: true, admin: true, editor: true, author: true, contributor: false },
  { permission: "posts.delete_others", owner: true, admin: true, editor: true, author: false, contributor: false },
  { permission: "posts.publish_own", owner: true, admin: true, editor: true, author: true, contributor: false },
  { permission: "posts.publish_others", owner: true, admin: true, editor: true, author: false, contributor: false },
  { permission: "posts.schedule", owner: true, admin: true, editor: true, author: false, contributor: false },
  { permission: "posts.submit_review", owner: true, admin: true, editor: true, author: true, contributor: true },
  { permission: "media.view", owner: true, admin: true, editor: true, author: true, contributor: true },
  { permission: "media.upload", owner: true, admin: true, editor: true, author: true, contributor: true },
  { permission: "media.delete", owner: true, admin: true, editor: true, author: false, contributor: false },
  { permission: "settings.view", owner: true, admin: true, editor: false, author: false, contributor: false },
  { permission: "settings.update", owner: true, admin: true, editor: false, author: false, contributor: false },
  { permission: "audit.view", owner: true, admin: true, editor: false, author: false, contributor: false },
];

const rateLimits = [
  { endpoint: "POST /api/settings/users (invites)", limit: "10 requests", window: "1 minute" },
  { endpoint: "POST /api/cli/exchange", limit: "20 requests", window: "1 minute" },
  { endpoint: "POST /api/v1/polls/[id]/vote", limit: "10 requests", window: "1 minute" },
  { endpoint: "POST /api/settings/export", limit: "5 requests", window: "1 minute" },
];

const auditChecks = [
  { check: "API Authorization", status: "PASS", notes: "All endpoints verify auth + project membership" },
  { check: "Project Isolation", status: "PASS", notes: "All queries scoped by projectId" },
  { check: "File Uploads", status: "PASS", notes: "MIME allowlist + magic byte validation" },
  { check: "XSS Prevention", status: "PASS", notes: "ProseMirror JSON AST, no raw HTML injection" },
  { check: "API Tokens", status: "PASS", notes: "SHA-256 hashed, never stored raw" },
  { check: "Rate Limiting", status: "PASS", notes: "Applied to sensitive endpoints" },
  { check: "Secrets Exposure", status: "PASS", notes: "No secrets in NEXT_PUBLIC_* variables" },
  { check: "SSRF Protection", status: "PASS", notes: "Private IP blocking, DNS rebinding prevention" },
];

export default function SecurityPage() {
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
                Security
              </span>
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Defense-in-depth
              <br />
              <span className="text-brand">at every layer.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
              OpenPost is architected with security-first principles across the database, application
              layer, and network boundaries. Every audit check passes.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1">
                <Clock className="h-3 w-3" /> Last reviewed: September 2026
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">All 8 checks passed</span>
              </span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Quick overview */}
      <section className="bg-surface py-8">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Lock,
                  title: "Row-Level Security",
                  desc: "Every table in PostgreSQL enforced by RLS policies.",
                },
                {
                  icon: Shield,
                  title: "5-Tier RBAC",
                  desc: "OWNER > ADMIN > EDITOR > AUTHOR > CONTRIBUTOR.",
                },
                {
                  icon: Globe,
                  title: "SSRF Protection",
                  desc: "Private IP blocking, DNS rebinding prevention.",
                },
                {
                  icon: Key,
                  title: "SHA-256 Tokens",
                  desc: "API tokens hashed before storage, never raw.",
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
      <section className="bg-surface pb-20 pt-8">
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
                <p className="text-xs font-bold">Found a vulnerability?</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Report it responsibly.
                </p>
                <a
                  href="mailto:officialopenpost@outlook.com?subject=%5BSecurity%5D%20OpenPost"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-brand px-3 py-2 text-xs font-bold text-navy hover:bg-brand-hover"
                >
                  Email us
                </a>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <Stagger stagger={0.06}>
              {/* 1. RLS */}
              <StaggerItem>
                <section
                  id="rls"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Lock className="h-4 w-4" />
                    </span>
                    1. Row-Level Security (RLS) Deep Dive
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    OpenPost enforces Row-Level Security on every table in PostgreSQL via Supabase
                    migrations. Even if an attacker executes raw SQL via the client Supabase library, RLS
                    policies prevent unauthorized reads or writes:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>
                      <strong className="text-navy">Public Access:</strong> Unauthenticated visitors can
                      only read blog posts where{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        status = &apos;published&apos;
                      </code>
                      . Drafts, revisions, and trash records cannot be queried by the public.
                    </li>
                    <li>
                      <strong className="text-navy">Authenticated Access:</strong> Contributors can only
                      edit their own drafts. Authors can edit and publish their own drafts. Editors and
                      above can edit any post in their project.
                    </li>
                    <li>
                      <strong className="text-navy">Admin Access:</strong> Only users with the ADMIN role
                      or project OWNER can modify workspace settings, invite members, suspend users, or
                      generate API keys.
                    </li>
                    <li>
                      <strong className="text-navy">Project Isolation:</strong> Every query is scoped by
                      projectId. A user in Project A cannot access data from Project B, even with a valid
                      session.
                    </li>
                  </ul>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-2 text-left font-semibold text-navy">Migration</th>
                          <th className="py-2 text-left font-semibold text-navy">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="text-text-secondary">
                        <tr className="border-b border-border/50">
                          <td className="py-2 font-mono text-[11px]">004_rls_policies.sql</td>
                          <td className="py-2">Base RLS on blogs, media, categories, tags</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 font-mono text-[11px]">014_project_rls.sql</td>
                          <td className="py-2">Project-scoped access for all tenant data</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 font-mono text-[11px]">017_rls_hardening.sql</td>
                          <td className="py-2">Strict role checks on write operations</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-[11px]">019_rls_final.sql</td>
                          <td className="py-2">Public read for published posts only</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </StaggerItem>

              {/* 2. RBAC */}
              <StaggerItem>
                <section
                  id="rbac"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Shield className="h-4 w-4" />
                    </span>
                    2. Role-Based Access Control (RBAC) Matrix
                  </h2>
                  <p className="mt-3 text-sm text-text-secondary">
                    OpenPost uses a 5-tier role hierarchy:{" "}
                    <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                      OWNER(5) &gt; ADMIN(4) &gt; EDITOR(3) &gt; AUTHOR(2) &gt; CONTRIBUTOR(1)
                    </code>
                    .
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-2 text-left font-semibold text-navy">Permission</th>
                          <th className="py-2 text-center font-semibold text-navy">OWNER</th>
                          <th className="py-2 text-center font-semibold text-navy">ADMIN</th>
                          <th className="py-2 text-center font-semibold text-navy">EDITOR</th>
                          <th className="py-2 text-center font-semibold text-navy">AUTHOR</th>
                          <th className="py-2 text-center font-semibold text-navy">CONTRIBUTOR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rbacPermissions.map((row) => (
                          <tr key={row.permission} className="border-b border-border/50">
                            <td className="py-1.5 font-mono text-text-secondary">{row.permission}</td>
                            {(["owner", "admin", "editor", "author", "contributor"] as const).map(
                              (role) => (
                                <td key={role} className="py-1.5 text-center">
                                  {row[role] ? (
                                    <CheckCircle2 className="inline h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <span className="inline-block h-3.5 w-3.5 rounded-full bg-border/50" />
                                  )}
                                </td>
                              )
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    <strong>Critical Rules:</strong> Never trust role from body/query/localStorage. Server
                    always verifies via requireProjectMember(). ADMIN cannot promote to OWNER.
                  </div>
                </section>
              </StaggerItem>

              {/* 3. SSRF */}
              <StaggerItem>
                <section
                  id="ssrf"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Globe className="h-4 w-4" />
                    </span>
                    3. Server-Side Request Forgery (SSRF) Protection
                  </h2>
                  <p className="mt-3 text-sm text-text-secondary">
                    When dispatching webhooks or resolving third-party embeds:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>
                      <strong className="text-navy">URL Validation:</strong>{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        isAllowedWebhookUrl()
                      </code>{" "}
                      blocks localhost, 127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, and
                      169.254.169.254 (AWS metadata).
                    </li>
                    <li>
                      <strong className="text-navy">DNS Rebinding Prevention:</strong> Resolved IP
                      addresses are re-verified before socket connection.
                    </li>
                    <li>
                      <strong className="text-navy">Timeout Enforcement:</strong> All outbound HTTP
                      requests use a 5-second timeout via deliverWebhook().
                    </li>
                    <li>
                      <strong className="text-navy">Manual Redirect Check:</strong> Webhook delivery
                      follows redirects manually and re-validates each redirect target.
                    </li>
                  </ul>
                </section>
              </StaggerItem>

              {/* 4. XSS */}
              <StaggerItem>
                <section
                  id="xss"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Eye className="h-4 w-4" />
                    </span>
                    4. XSS Prevention with Structured JSON AST
                  </h2>
                  <p className="mt-3 text-sm text-text-secondary">
                    OpenPost eliminates XSS vulnerabilities through its content architecture:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>
                      <strong className="text-navy">ProseMirror JSON Storage:</strong> Articles are
                      stored as structured JSON nodes, not raw HTML.
                    </li>
                    <li>
                      <strong className="text-navy">React DOM Rendering:</strong> SharedRender.tsx
                      creates virtual DOM elements for each block — text content is automatically
                      HTML-escaped by React.
                    </li>
                    <li>
                      <strong className="text-navy">No Raw HTML Injection:</strong> The public renderer
                      never uses dangerouslySetInnerHTML for user content.
                    </li>
                    <li>
                      <strong className="text-navy">SVG Sanitization:</strong> Uploaded SVGs are scanned
                      for{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        &lt;script&gt;
                      </code>
                      , on* event handlers, and{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        &lt;foreignObject&gt;
                      </code>{" "}
                      tags.
                    </li>
                  </ul>
                </section>
              </StaggerItem>

              {/* 5. API Tokens */}
              <StaggerItem>
                <section
                  id="api-tokens"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Key className="h-4 w-4" />
                    </span>
                    5. API Token Security
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>
                      <strong className="text-navy">SHA-256 Hashing:</strong> Tokens are hashed before
                      storage via hashToken(). Raw tokens are never stored in the database.
                    </li>
                    <li>
                      <strong className="text-navy">Token Prefix:</strong> Only the first 6 characters
                      (op_live_...) are stored for display/debugging.
                    </li>
                    <li>
                      <strong className="text-navy">Project Scoping:</strong> Each token is bound to a
                      single project. The X-OpenPost-Project header must match.
                    </li>
                    <li>
                      <strong className="text-navy">Bearer Authentication:</strong> All v1 API requests
                      require{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        Authorization: Bearer op_live_&lt;64hex&gt;
                      </code>
                      .
                    </li>
                  </ul>
                </section>
              </StaggerItem>

              {/* 6. File Upload */}
              <StaggerItem>
                <section
                  id="file-upload"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Upload className="h-4 w-4" />
                    </span>
                    6. File Upload Security
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>
                      <strong className="text-navy">MIME Allowlist:</strong> Only PNG, JPEG, WebP, GIF,
                      AVIF, PDF, SVG, and MP4 are accepted.
                    </li>
                    <li>
                      <strong className="text-navy">Magic Byte Validation:</strong>{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        validateMagicBytes()
                      </code>{" "}
                      verifies file content matches declared MIME type.
                    </li>
                    <li>
                      <strong className="text-navy">Server-Side Key Generation:</strong> Upload keys are
                      generated as{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        openpost-media/&lt;projectId&gt;/&lt;uuid&gt;.&lt;ext&gt;
                      </code>{" "}
                      — prevents path traversal.
                    </li>
                    <li>
                      <strong className="text-navy">SHA-256 Checksum:</strong> Computed server-side on the
                      actual uploaded bytes.
                    </li>
                  </ul>
                </section>
              </StaggerItem>

              {/* 7. Polls */}
              <StaggerItem>
                <section
                  id="polls"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <BarChart3 className="h-4 w-4" />
                    </span>
                    7. Voter Fraud Prevention (Polls)
                  </h2>
                  <p className="mt-3 text-sm text-text-secondary">
                    Poll voting prevents ballot stuffing through:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>
                      <strong className="text-navy">Fingerprint:</strong> SHA-256 hash of client_ip +
                      user_agent + project_salt.
                    </li>
                    <li>
                      <strong className="text-navy">Unique Constraint:</strong>{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        UNIQUE (poll_id, voter_fingerprint)
                      </code>{" "}
                      in the database.
                    </li>
                    <li>
                      <strong className="text-navy">Rate Limiting:</strong> 10 votes per minute per IP.
                    </li>
                    <li>
                      <strong className="text-navy">Conflict Response:</strong> Re-voting triggers HTTP
                      409.
                    </li>
                  </ul>
                </section>
              </StaggerItem>

              {/* 8. Rate Limiting */}
              <StaggerItem>
                <section
                  id="rate-limiting"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Clock className="h-4 w-4" />
                    </span>
                    8. Rate Limiting
                  </h2>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-2 text-left font-semibold text-navy">Endpoint</th>
                          <th className="py-2 text-left font-semibold text-navy">Limit</th>
                          <th className="py-2 text-left font-semibold text-navy">Window</th>
                        </tr>
                      </thead>
                      <tbody className="text-text-secondary">
                        {rateLimits.map((rl) => (
                          <tr key={rl.endpoint} className="border-b border-border/50">
                            <td className="py-2 font-mono text-[11px]">{rl.endpoint}</td>
                            <td className="py-2">{rl.limit}</td>
                            <td className="py-2">{rl.window}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-xs text-text-tertiary">
                    Supabase Auth handles rate limiting for login/signup endpoints.
                  </p>
                </section>
              </StaggerItem>

              {/* 9. Env Security */}
              <StaggerItem>
                <section
                  id="env-security"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Server className="h-4 w-4" />
                    </span>
                    9. Environment Variable Security
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>
                      <strong className="text-navy">Never expose secrets client-side:</strong> All{" "}
                      <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">
                        NEXT_PUBLIC_*
                      </code>{" "}
                      variables are legitimate public values.
                    </li>
                    <li>
                      <strong className="text-navy">Secrets stay server-side:</strong>{" "}
                      SUPABASE_SERVICE_ROLE_KEY, R2_SECRET_ACCESS_KEY, CRON_SECRET, DATABASE_URL are
                      never prefixed with NEXT_PUBLIC_.
                    </li>
                    <li>
                      <strong className="text-navy">CORS:</strong> No Access-Control-Allow-Origin: * on
                      authenticated routes.
                    </li>
                  </ul>
                </section>
              </StaggerItem>

              {/* 10. Audit Results */}
              <StaggerItem>
                <section
                  id="audit-results"
                  className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    10. Security Audit Results
                  </h2>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-2 text-left font-semibold text-navy">Check</th>
                          <th className="py-2 text-center font-semibold text-navy">Status</th>
                          <th className="py-2 text-left font-semibold text-navy">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="text-text-secondary">
                        {auditChecks.map((ac) => (
                          <tr key={ac.check} className="border-b border-border/50">
                            <td className="py-2 font-medium text-navy">{ac.check}</td>
                            <td className="py-2 text-center">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                {ac.status}
                              </span>
                            </td>
                            <td className="py-2">{ac.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </StaggerItem>

              {/* 11. Disclosure */}
              <StaggerItem>
                <section
                  id="disclosure"
                  className="scroll-mt-28 rounded-2xl border-2 border-brand/20 bg-brand/5 p-6 sm:p-7"
                >
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-navy">
                      <Mail className="h-4 w-4" />
                    </span>
                    11. Responsible Disclosure
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    If you discover a security vulnerability:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary list-disc pl-5 marker:text-brand">
                    <li>
                      <strong className="text-navy">Email:</strong>{" "}
                      <a
                        href="mailto:officialopenpost@outlook.com?subject=%5BSecurity%5D%20OpenPost"
                        className="text-brand hover:underline font-semibold"
                      >
                        officialopenpost@outlook.com
                      </a>
                    </li>
                    <li>
                      <strong className="text-navy">Subject:</strong>{" "}
                      <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-xs">
                        [Security] OpenPost — brief description
                      </code>
                    </li>
                    <li>
                      Do <strong>not</strong> open a public GitHub issue for security reports.
                    </li>
                    <li>We aim to acknowledge within 24 hours and provide a fix timeline.</li>
                  </ul>
                  <p className="mt-3 text-xs text-text-tertiary">
                    All reports are handled confidentially.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href="mailto:officialopenpost@outlook.com?subject=%5BSecurity%5D%20OpenPost"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-dark"
                    >
                      <Mail className="h-4 w-4" /> Report Vulnerability
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
