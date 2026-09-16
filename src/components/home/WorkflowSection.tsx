"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  PenLine,
  Send,
  CheckCircle2,
  Globe,
  Clock,
  Crown,
  Shield,
  Edit3,
  UserCheck,
  FileText,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const workflowSteps = [
  {
    icon: PenLine,
    title: "Write",
    role: "Author / Contributor",
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    textColor: "text-blue-700",
    description: "Create drafts with the block editor. Autosave preserves every keystroke. Submit for review when ready.",
    permissions: ["Create posts", "Edit own drafts", "Upload media", "Submit for review"],
  },
  {
    icon: Send,
    title: "Review",
    role: "Editor",
    color: "bg-purple-500",
    lightColor: "bg-purple-50",
    textColor: "text-purple-700",
    description: "Review submissions, request changes, or approve content. Edit any post in the publication.",
    permissions: ["Edit any post", "Approve/reject", "Manage authors", "Schedule posts"],
  },
  {
    icon: CheckCircle2,
    title: "Approve",
    role: "Admin",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    description: "Final approval gate. Manage team members, assign roles, and configure project settings.",
    permissions: ["Approve users", "Manage team", "Update settings", "View audit logs"],
  },
  {
    icon: Globe,
    title: "Publish",
    role: "Auto / Cron",
    color: "bg-amber-500",
    lightColor: "bg-amber-50",
    textColor: "text-amber-700",
    description: "Content goes live instantly or on schedule. Cached at the edge for sub-50ms delivery worldwide.",
    permissions: ["Instant publish", "Scheduled posts", "Edge caching", "SEO auto-generate"],
  },
];

const roles = [
  {
    name: "Owner",
    icon: Crown,
    color: "from-amber-400 to-amber-600",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    count: "1",
    capabilities: "Full project control, delete project, manage all roles including other owners",
  },
  {
    name: "Admin",
    icon: Shield,
    color: "from-indigo-400 to-indigo-600",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    count: "1-3",
    capabilities: "Team management, approve users, update settings, view audit logs",
  },
  {
    name: "Editor",
    icon: Edit3,
    color: "from-blue-400 to-blue-600",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    count: "2-5",
    capabilities: "Edit any post, publish, schedule, manage authors and categories",
  },
  {
    name: "Author",
    icon: PenLine,
    color: "from-emerald-400 to-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    count: "5-20",
    capabilities: "Create posts, publish own content, upload media, manage own byline",
  },
  {
    name: "Contributor",
    icon: UserCheck,
    color: "from-slate-400 to-slate-600",
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    count: "Unlimited",
    capabilities: "Create drafts, submit for review, view media library",
  },
];

export function WorkflowSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="relative bg-surface-dim py-20 sm:py-32 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-light-dots opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white px-4 py-1.5 mb-5">
              <Clock className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-bold text-navy uppercase tracking-wide">Editorial Workflow</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-navy tracking-tight leading-tight">
              From draft to publish
              <br />
              <span className="gradient-text-brand">in four steps</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
              A structured editorial pipeline with role-based access control.
              Every action is audited, every permission is enforced server-side.
            </p>
          </div>
        </FadeIn>

        {/* Workflow Pipeline */}
        <FadeIn>
          <div className="max-w-5xl mx-auto">
            {/* Step indicators */}
            <div className="flex items-center justify-between mb-8 relative">
              {/* Connection line */}
              <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-border" />
              <div
                className="absolute top-5 left-[10%] h-0.5 bg-gradient-to-r from-brand to-flame transition-all duration-500"
                style={{ width: `${(activeStep / (workflowSteps.length - 1)) * 80}%` }}
              />

              {workflowSteps.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === activeStep;
                const isDone = i < activeStep;
                return (
                  <button
                    key={step.title}
                    onClick={() => setActiveStep(i)}
                    className="relative z-10 flex flex-col items-center gap-2 group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? `${step.color} border-transparent text-white shadow-lg`
                          : isDone
                          ? "bg-brand border-brand text-white"
                          : "bg-white border-border text-text-tertiary group-hover:border-brand group-hover:text-brand"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </motion.div>
                    <span className={`text-xs font-bold transition-colors ${isActive ? "text-navy" : "text-text-tertiary"}`}>
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active step detail */}
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-lg shadow-navy/5"
            >
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${workflowSteps[activeStep].color} text-white`}>
                      {(() => {
                        const StepIcon = workflowSteps[activeStep].icon;
                        return <StepIcon className="h-5 w-5" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-navy">{workflowSteps[activeStep].title}</h3>
                      <span className={`text-xs font-bold ${workflowSteps[activeStep].textColor}`}>
                        {workflowSteps[activeStep].role}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {workflowSteps[activeStep].description}
                  </p>
                </div>

                <div className="lg:w-80 shrink-0">
                  <h4 className="text-xs font-bold text-navy uppercase tracking-wide mb-3">Permissions</h4>
                  <div className="space-y-2">
                    {workflowSteps[activeStep].permissions.map((perm) => (
                      <div key={perm} className="flex items-center gap-2 text-sm text-text-secondary">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <button
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                  className="text-xs font-bold text-text-tertiary hover:text-navy disabled:opacity-30 transition"
                >
                  ← Previous
                </button>
                <div className="flex gap-1.5">
                  {workflowSteps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeStep ? "w-6 bg-brand" : "w-1.5 bg-border hover:bg-brand/40"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setActiveStep(Math.min(workflowSteps.length - 1, activeStep + 1))}
                  disabled={activeStep === workflowSteps.length - 1}
                  className="text-xs font-bold text-brand hover:text-flame disabled:opacity-30 transition"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          </div>
        </FadeIn>

        {/* Role Hierarchy */}
        <FadeIn delay={0.2}>
          <div className="mt-20 max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
                Five-tier role hierarchy
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                Granular permissions enforced at the database level. No client-side bypasses.
              </p>
            </div>

            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" stagger={0.08}>
              {roles.map((role, i) => {
                const Icon = role.icon;
                return (
                  <StaggerItem key={role.name}>
                    <motion.div
                      whileHover={{ y: -3 }}
                      className="relative p-5 rounded-2xl border border-border bg-white hover:shadow-lg transition-all"
                    >
                      {/* Hierarchy indicator */}
                      <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-navy text-[10px] font-black text-white">
                        {5 - i}
                      </div>

                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${role.color} text-white mb-3`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <h4 className="text-sm font-bold text-navy">{role.name}</h4>
                      <div className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${role.badge}`}>
                        {role.count} per project
                      </div>
                      <p className="mt-3 text-xs text-text-secondary leading-relaxed">
                        {role.capabilities}
                      </p>
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </Stagger>

            {/* Hierarchy arrows */}
            <div className="hidden lg:flex items-center justify-center gap-2 mt-6 text-text-tertiary">
              <span className="text-xs font-semibold">Highest authority</span>
              <ArrowRight className="h-3 w-3" />
              <div className="flex items-center gap-1">
                {["Owner", "Admin", "Editor", "Author", "Contributor"].map((r, i) => (
                  <span key={r} className="text-[10px] font-bold text-navy">{r}{i < 4 && <ChevronRight className="inline h-2.5 w-2.5" />}</span>
                ))}
              </div>
              <ArrowRight className="h-3 w-3" />
              <span className="text-xs font-semibold">Lowest authority</span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
