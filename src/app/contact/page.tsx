"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Mail, MapPin, Phone, Clock, Send, MessageSquare } from "lucide-react";

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
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24 relative">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2">
              <MessageSquare className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-semibold text-brand">Get in touch</span>
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
              We&apos;d love to hear
              <br />
              <span className="text-brand">from you.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
              Have a question about OpenPost? Need help self-hosting? Want to contribute? Drop us a message and we&apos;ll get back within 24 hours.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Content */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-3"
            >
              <div className="rounded-2xl border border-border bg-surface p-8 shadow-xl shadow-navy/5">
                <h2 className="text-xl font-bold text-text-primary">Send us a message</h2>
                <p className="mt-2 text-sm text-text-secondary">Fill in the form and we&apos;ll respond as soon as possible.</p>

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
                    <input
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="How can we help?"
                      required
                      className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-primary">Message</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us a little about your project..."
                      required
                      rows={5}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-navy shadow-md shadow-brand/20 hover:bg-brand-hover transition"
                  >
                    {sent ? (
                      "Message sent ✓"
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

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="rounded-2xl border border-border bg-surface-raised p-6">
                <h3 className="text-base font-bold text-text-primary">Contact information</h3>
                <div className="mt-6 space-y-5">
                  {[
                    { icon: Mail, label: "Email", value: "officialopenpost@outlook.com", desc: "Our inbox is always open — we reply within 24h" },
                    { icon: Phone, label: "Phone", value: "+1 (555) 123-4567", desc: "Mon–Fri, 9am–6pm PST" },
                    { icon: MapPin, label: "Office", value: "San Francisco, CA", desc: "Remote-first, office optional" },
                    { icon: Clock, label: "Response time", value: "< 24 hours", desc: "Average 4 hours on weekdays" },
                  ].map((item) => (
                    <div key={item.label} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                        <p className="mt-1 text-sm font-medium text-brand">{item.value}</p>
                        <p className="text-xs text-text-tertiary">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-6">
                <h3 className="text-base font-bold text-text-primary">Connect with us</h3>
                <p className="mt-2 text-sm text-text-secondary">Follow our journey, contribute, or just say hi.</p>
                <div className="mt-5 flex gap-3">
                  <a href="#" aria-label="GitHub" className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface hover:bg-navy hover:text-white hover:border-navy transition">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  </a>
                  <a href="#" aria-label="Twitter" className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface hover:bg-navy hover:text-white hover:border-navy transition">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a href="mailto:officialopenpost@outlook.com" aria-label="Email" className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface hover:bg-navy hover:text-white hover:border-navy transition">
                    <Mail className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="rounded-2xl bg-navy p-6 text-white">
                <h3 className="text-base font-bold">Prefer to self-host?</h3>
                <p className="mt-2 text-sm text-slate-400">Check our documentation for Docker and Vercel deployment guides. MIT licensed, your data stays yours.</p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand border border-brand/20">Docker</span>
                  <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand border border-brand/20">Vercel</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
