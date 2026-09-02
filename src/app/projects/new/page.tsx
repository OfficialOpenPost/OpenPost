"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Palette,
  Link2,
  Sparkles,
  Type,
  Megaphone,
  Rocket,
  Check,
  PenLine,
  Layout,
  Paintbrush,
  PartyPopper,
  Eye,
} from "lucide-react";

type StepId = "name" | "slug" | "settings" | "color" | "review";

const STEPS: { id: StepId; label: string; icon: typeof PenLine; color: string }[] = [
  { id: "name", label: "Name", icon: PenLine, color: "amber" },
  { id: "slug", label: "URL", icon: Link2, color: "blue" },
  { id: "settings", label: "Details", icon: Layout, color: "violet" },
  { id: "color", label: "Theme", icon: Paintbrush, color: "rose" },
  { id: "review", label: "Launch", icon: Rocket, color: "emerald" },
];

const PRESET_COLORS = [
  { name: "Amber", value: "#F59E0B" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Emerald", value: "#10B981" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Orange", value: "#F97316" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Lime", value: "#84CC16" },
  { name: "Slate", value: "#64748B" },
];

const fadeSlide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.28, ease: "easeOut" as const },
};

export default function NewProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [siteTitle, setSiteTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#F59E0B");

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const generateSlug = useCallback((v: string) => {
    return v.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }, []);

  useEffect(() => {
    if (name && !slug) setSlug(generateSlug(name));
  }, [name, slug, generateSlug]);

  const canNext = (): boolean => {
    if (currentStep === 0) return name.trim().length >= 2;
    if (currentStep === 1) return slug.trim().length >= 2;
    return true;
  };

  const goNext = () => {
    if (!canNext()) {
      setTouched((t) => ({ ...t, ...(currentStep === 0 ? { name: true } : { slug: true }) }));
      return;
    }
    if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) {
      setError("Website name and slug are required.");
      return;
    }
    try {
      setCreating(true);
      setError(null);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          domain: domain.trim() || undefined,
          settings: {
            siteTitle: siteTitle.trim() || name.trim(),
            tagline: tagline.trim() || undefined,
            primaryColor,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create website.");
      setSuccess(true);
      if (json.data?.id) {
        localStorage.setItem("openpost_active_project_id", json.data.id);
        window.dispatchEvent(new Event("projectChanged"));
      }
      setTimeout(() => router.push("/dashboard"), 2200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const inputBase =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all duration-200";

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-2xl shadow-emerald-300/40 mb-8"
          >
            <PartyPopper className="h-11 w-11 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-extrabold text-gray-900 tracking-tight"
          >
            You&apos;re all set!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-3 text-base text-gray-500 leading-relaxed"
          >
            <strong className="text-gray-900 font-bold">{name}</strong> is being created.
            <br />Redirecting to your dashboard...
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 flex justify-center">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                  className="w-2.5 h-2.5 rounded-full bg-emerald-400"
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Back link */}
      <div className="max-w-2xl mx-auto px-6 pt-5">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-0 mb-2">
          {STEPS.map((step, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    className={`relative flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold transition-all duration-300 ${
                      isDone
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                        : isActive
                        ? "bg-amber-400 text-white shadow-md shadow-amber-200"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                    {isActive && (
                      <motion.div
                        layoutId="activeStep"
                        className="absolute inset-0 rounded-xl border-2 border-amber-300"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 mx-2 h-px relative mt-[-14px]">
                    <div className="absolute inset-0 bg-gray-200 rounded-full" />
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: isDone ? 1 : 0 }}
                      className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full origin-left"
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-2xl mx-auto px-6 pt-10 pb-20 min-h-[calc(100vh-6rem)]">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-semibold">{error}</p>
                {error.includes("Only owners") && (
                  <p className="mt-1 text-xs text-red-500">Contact your project owner or admin.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* STEP 1: Name */}
          {currentStep === 0 && (
            <motion.div key="name" {...fadeSlide} className="space-y-8">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 mb-6"
                >
                  <PenLine className="h-7 w-7 text-amber-500" />
                </motion.div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  What&apos;s your website called?
                </h1>
                <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Pick a memorable name for your new publication. You can change it later.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Engineering Blog, Company News"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setTouched((t) => ({ ...t, name: false }));
                    }}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    onKeyDown={(e) => e.key === "Enter" && goNext()}
                    className={`${inputBase} focus:border-amber-400 focus:ring-amber-100 text-base py-4 px-5`}
                    autoFocus
                  />
                  {name && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    </motion.div>
                  )}
                </div>
                {touched.name && !name.trim() && (
                  <p className="text-xs text-red-500 pl-1">Please enter a website name.</p>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Slug */}
          {currentStep === 1 && (
            <motion.div key="slug" {...fadeSlide} className="space-y-8">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 mb-6"
                >
                  <Link2 className="h-7 w-7 text-blue-500" />
                </motion.div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Set your website URL
                </h1>
                <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                  This is how people will find your site on the web.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">URL Path</label>
                  <div className="flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                    <span className="text-gray-400 font-mono text-sm select-none">openpost.app/</span>
                    <input
                      type="text"
                      placeholder="my-website"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                        setTouched((t) => ({ ...t, slug: false }));
                      }}
                      onBlur={() => setTouched((t) => ({ ...t, slug: true }))}
                      onKeyDown={(e) => e.key === "Enter" && goNext()}
                      className="flex-1 bg-transparent font-mono text-sm text-gray-900 focus:outline-none ml-1 placeholder:text-gray-300"
                    />
                  </div>
                  {touched.slug && !slug.trim() && (
                    <p className="mt-1.5 text-xs text-red-500 pl-1">Please enter a valid slug.</p>
                  )}
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    Auto-generated from name. Lowercase, numbers, hyphens only.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Description</label>
                  <textarea
                    rows={2}
                    placeholder="What is this website about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`${inputBase} focus:border-blue-400 focus:ring-blue-100 resize-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                    Custom Domain <span className="text-gray-400 font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="blog.example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className={`${inputBase} focus:border-blue-400 focus:ring-blue-100`}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Settings */}
          {currentStep === 2 && (
            <motion.div key="settings" {...fadeSlide} className="space-y-8">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 border border-violet-200 mb-6"
                >
                  <Layout className="h-7 w-7 text-violet-500" />
                </motion.div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Configure your site
                </h1>
                <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                  How visitors will see your website. All fields are optional.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Site Title</label>
                  <div className="flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all duration-200">
                    <Type className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      placeholder={name || "e.g. The Engineering Blog"}
                      value={siteTitle}
                      onChange={(e) => setSiteTitle(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none ml-2.5"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-400">Browser tab and site header. Defaults to website name.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Tagline</label>
                  <div className="flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all duration-200">
                    <Megaphone className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="e.g. Insights from our engineering team"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none ml-2.5"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Color */}
          {currentStep === 3 && (
            <motion.div key="color" {...fadeSlide} className="space-y-8">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 mb-6"
                >
                  <Paintbrush className="h-7 w-7 text-rose-500" />
                </motion.div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Pick your brand color
                </h1>
                <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Used for buttons, links, and accent elements across your site.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-5">
                {/* Preset grid */}
                <div className="grid grid-cols-4 gap-2.5">
                  {PRESET_COLORS.map((c) => (
                    <motion.button
                      key={c.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPrimaryColor(c.value)}
                      className={`group relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200 ${
                        primaryColor === c.value
                          ? "border-gray-900 bg-gray-50 shadow-md"
                          : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-110" style={{ backgroundColor: c.value }} />
                      <span className="text-[10px] font-semibold text-gray-500 group-hover:text-gray-700 transition-colors">{c.name}</span>
                      {primaryColor === c.value && (
                        <motion.div layoutId="colorCheck" className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center shadow-md">
                          <Check className="h-3 w-3 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Custom */}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-12 w-12 rounded-xl border border-gray-200 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-mono text-gray-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100 transition-all"
                    />
                    <div className="h-12 w-12 rounded-xl border border-gray-200 shadow-inner shrink-0" style={{ backgroundColor: primaryColor }} />
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Live Preview</span>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-md" style={{ backgroundColor: primaryColor }}>
                          {name ? name.slice(0, 2).toUpperCase() : "OP"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{siteTitle || name || "Your Website"}</p>
                          <p className="text-[11px] text-gray-500">{tagline || "Your tagline here"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow-md" style={{ backgroundColor: primaryColor }}>
                        Read More
                      </div>
                      <div className="px-4 py-2 rounded-lg text-xs font-bold border-2" style={{ borderColor: `${primaryColor}44`, color: primaryColor }}>
                        Learn More
                      </div>
                      <div className="px-4 py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}>
                        Subscribe
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Review */}
          {currentStep === 4 && (
            <motion.div key="review" {...fadeSlide} className="space-y-8">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 mb-6"
                >
                  <Rocket className="h-7 w-7 text-emerald-500" />
                </motion.div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Ready to launch?
                </h1>
                <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Review your settings and create your website.
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  {/* Color bar */}
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}88)` }} />

                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-md shrink-0" style={{ backgroundColor: primaryColor }}>
                        {name ? name.slice(0, 2).toUpperCase() : "OP"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-gray-900 truncate">{siteTitle || name || "Your Website"}</p>
                        <p className="text-xs text-gray-500 truncate">{tagline || "No tagline set"}</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <Row label="Website" value={name || "—"} />
                      <Row label="URL" value={`openpost.app/${slug || "..."}`} mono />
                      <Row label="Description" value={description || "—"} />
                      {domain && <Row label="Domain" value={domain} mono />}
                      <Row
                        label="Brand Color"
                        value={
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-md shadow-inner" style={{ backgroundColor: primaryColor }} />
                            <span className="font-mono">{primaryColor}</span>
                          </div>
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Quick edit */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {STEPS.slice(0, 4).map((step, i) => (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(i)}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-2.5 text-[10px] font-semibold text-gray-500 hover:border-gray-900 hover:text-gray-900 hover:shadow-sm transition-all"
                    >
                      <step.icon className="h-3.5 w-3.5" />
                      {step.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom nav */}
        <div className="max-w-md mx-auto mt-12">
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={goBack}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: canNext() ? 1.02 : 1 }}
              whileTap={{ scale: canNext() ? 0.98 : 1 }}
              onClick={currentStep === STEPS.length - 1 ? handleSubmit : goNext}
              disabled={creating || (!canNext() && currentStep !== STEPS.length - 1)}
              className={`flex-1 flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${
                currentStep === STEPS.length - 1
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600"
                  : "bg-gray-900 text-white shadow-lg shadow-gray-300 hover:bg-gray-800"
              }`}
            >
              {creating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
              ) : currentStep === STEPS.length - 1 ? (
                <><Rocket className="h-4 w-4" /> Launch Website</>
              ) : (
                <>Continue <ArrowRight className="h-4 w-4" /></>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-400 text-xs shrink-0">{label}</span>
      <span className={`text-gray-900 text-right truncate ${mono ? "font-mono text-xs" : "font-semibold text-sm"}`}>{value}</span>
    </div>
  );
}
