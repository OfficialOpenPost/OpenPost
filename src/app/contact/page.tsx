"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import {
  Mail,
  Clock,
  Send,
  MessageSquare,
  BookOpen,
  Bug,
  HelpCircle,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

const faqs = [
  {
    q: "How do I self-host OpenPost?",
    a: "Follow our deployment guide in the docs. You'll need a Supabase project, Cloudflare R2 bucket, and a Vercel or Docker host. The entire setup takes about 5 minutes.",
  },
  {
    q: "Is there a free tier for the cloud?",
    a: "Yes. The cloud includes 1 project, unlimited posts, and full API access. No credit card required to get started.",
  },
  {
    q: "Can I import content from WordPress or Ghost?",
    a: "We're working on import tools. In the meantime, you can export your existing content and use the REST API to bulk-import posts into OpenPost.",
  },
  {
    q: "How do I report a bug or request a feature?",
    a: "Open a GitHub issue with the appropriate label. For security vulnerabilities, please email us directly instead of opening a public issue.",
  },
  {
    q: "Do you offer enterprise or agency support?",
    a: "Contact us at officialopenpost@outlook.com to discuss custom support arrangements, SLAs, or dedicated infrastructure.",
  },
];

function FAQItem({ item }: { item: (typeof faqs)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full p-5 text-left"
      >
        <span className="text-sm font-semibold text-text-primary pr-4">{item.q}</span>
        <ChevronDown
          className={`h-4 w-4 text-text-tertiary shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="px-5 pb-5"
        >
          <p className="text-sm leading-relaxed text-text-secondary">{item.a}</p>
        </motion.div>
      )}
    </div>
  );
}

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

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
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32 relative">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2">
              <MessageSquare className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-semibold text-brand">Get in touch</span>
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              We&apos;d love to hear
              <br />
              <span className="text-brand">from you.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
              Have a question about OpenPost? Need help self-hosting? Want to contribute or report a bug?
              We&apos;re here to help.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Contact channels */}
      <section className="bg-surface py-8">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Mail,
                  title: "Email",
                  value: "officialopenpost@outlook.com",
                  desc: "We reply within 24 hours",
                  href: "mailto:officialopenpost@outlook.com",
                },
                {
                  icon: Bug,
                  title: "GitHub Issues",
                  value: "Bug reports & features",
                  desc: "Open an issue anytime",
                  href: "https://github.com",
                },
                {
                  icon: BookOpen,
                  title: "Documentation",
                  value: "Guides & API reference",
                  desc: "Self-hosting, CLI, API docs",
                  href: "/docs",
                },
                {
                  icon: Bug,
                  title: "Security",
                  value: "Report vulnerabilities",
                  desc: "Confidential disclosure",
                  href: "mailto:officialopenpost@outlook.com?subject=%5BSecurity%5D",
                },
              ].map((ch) => (
                <a
                  key={ch.title}
                  href={ch.href}
                  target={ch.href.startsWith("http") ? "_blank" : undefined}
                  rel={ch.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group rounded-2xl border border-border bg-white p-5 hover:border-brand/20 hover:shadow-md transition"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition">
                    <ch.icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-text-primary">{ch.title}</h3>
                  <p className="mt-1 text-sm font-medium text-brand">{ch.value}</p>
                  <p className="mt-0.5 text-xs text-text-tertiary">{ch.desc}</p>
                </a>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Form + Info */}
      <section className="bg-surface pb-20 pt-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-3"
            >
              <div className="rounded-2xl border border-border bg-white p-8 shadow-xl shadow-navy/5">
                <h2 className="text-xl font-bold text-text-primary">Send us a message</h2>
                <p className="mt-2 text-sm text-text-secondary">
                  Fill in the form and we&apos;ll get back to you as soon as possible.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text-primary">Full name</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Jane Doe"
                        required
                        className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text-primary">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        required
                        className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-primary">Subject</label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      required
                      className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition appearance-none"
                    >
                      <option value="" disabled>
                        Select a topic
                      </option>
                      <option value="general">General question</option>
                      <option value="self-hosting">Self-hosting help</option>
                      <option value="bug">Bug report</option>
                      <option value="feature">Feature request</option>
                      <option value="enterprise">Enterprise / agency support</option>
                      <option value="security">Security vulnerability</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-primary">Message</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us about your question, project, or how we can help..."
                      required
                      rows={5}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sent}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-navy shadow-md shadow-brand/20 hover:bg-brand-hover transition disabled:opacity-70"
                  >
                    {sent ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Message sent
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Send message
                      </>
                    )}
                  </button>

                  {sent && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center text-sm font-medium text-success"
                    >
                      Thanks! We&apos;ll get back to you within 24 hours.
                    </motion.p>
                  )}
                </form>
              </div>
            </motion.div>

            {/* Info sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="rounded-2xl border border-border bg-white p-6">
                <h3 className="text-base font-bold text-text-primary">Contact information</h3>
                <div className="mt-6 space-y-5">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Email</p>
                      <a
                        href="mailto:officialopenpost@outlook.com"
                        className="mt-1 text-sm font-medium text-brand hover:underline"
                      >
                        officialopenpost@outlook.com
                      </a>
                      <p className="text-xs text-text-tertiary">Our inbox is always open</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Response time</p>
                      <p className="mt-1 text-sm font-medium text-brand">&lt; 24 hours</p>
                      <p className="text-xs text-text-tertiary">Usually faster on weekdays</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Remote-first</p>
                      <p className="mt-1 text-sm font-medium text-brand">Global team</p>
                      <p className="text-xs text-text-tertiary">No physical office — fully distributed</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-white p-6">
                <h3 className="text-base font-bold text-text-primary">Connect with us</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Follow our journey, contribute, or just say hi.
                </p>
                <div className="mt-5 flex gap-3">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface hover:bg-navy hover:text-white hover:border-navy transition"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface hover:bg-navy hover:text-white hover:border-navy transition"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href="mailto:officialopenpost@outlook.com"
                    aria-label="Email"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface hover:bg-navy hover:text-white hover:border-navy transition"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="rounded-2xl bg-navy p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="h-4 w-4 text-brand" />
                  <h3 className="text-base font-bold">Prefer to self-host?</h3>
                </div>
                <p className="text-sm text-slate-400">
                  Check our documentation for Docker and Vercel deployment guides. MIT licensed, your data
                  stays yours.
                </p>
                <a
                  href="/docs"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                >
                  Read the docs <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface-raised py-20">
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">
                Frequently asked
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
                Common questions
              </h2>
            </div>
          </FadeIn>
          <Stagger className="mt-10 space-y-3" stagger={0.06}>
            {faqs.map((faq) => (
              <StaggerItem key={faq.q}>
                <FAQItem item={faq} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </div>
  );
}

function Globe(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
