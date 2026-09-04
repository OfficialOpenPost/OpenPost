"use client";

import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import {
  GripVertical,
  Plus,
  Trash2,
  BarChart3,
  Edit3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  CheckCircle2,
  ShieldCheck,
  Clock,
  X,
  Check,
  Layers,
  TrendingUp,
  Users,
  RefreshCw,
  Activity,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export function PollBlockView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const {
    question = "What do you think?",
    description = "",
    options: rawOptions,
    type = "single",
    showResults = "always",
    allowAnonymous = true,
    closesAt = null,
    align = "center",
    layout = "center",
    width = "100%",
    pollId,
  } = node.attrs;

  const [options, setOptions] = useState<Array<{ id: string; label: string }>>(
    rawOptions ?? [
      { id: "1", label: "Option A" },
      { id: "2", label: "Option B" },
    ]
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState<"edit" | "analytics">("edit");

  // Edit Modal Form State
  const [modalQuestion, setModalQuestion] = useState(question);
  const [modalDescription, setModalDescription] = useState(description);
  const [modalOptions, setModalOptions] = useState<Array<{ id: string; label: string }>>(options);
  const [modalShowResults, setModalShowResults] = useState<"always" | "after_vote" | "after_close">(showResults);
  const [modalAllowAnonymous, setModalAllowAnonymous] = useState<boolean>(allowAnonymous);
  const [modalClosesAt, setModalClosesAt] = useState<string>(closesAt || "");
  const [modalAlign, setModalAlign] = useState<"left" | "center" | "right" | "wide">(layout || align || "center");
  const [modalWidth, setModalWidth] = useState<string>(width || "100%");

  // Analytics Tab State
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [currentPollAnalytics, setCurrentPollAnalytics] = useState<any>(null);
  const [allProjectPolls, setAllProjectPolls] = useState<any[]>([]);
  const [selectedAnalyticsPollId, setSelectedAnalyticsPollId] = useState<string | null>(pollId || null);

  // Keep local options in sync when node attributes change
  useEffect(() => {
    if (rawOptions && JSON.stringify(rawOptions) !== JSON.stringify(options)) {
      setOptions(rawOptions);
    }
  }, [rawOptions]);

  // Load analytics when opening Analytics tab
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const headers: Record<string, string> = {};
      if (activeProjId) headers["X-OpenPost-Project"] = activeProjId;

      // 1. Fetch current poll details if UUID exists
      const targetId = selectedAnalyticsPollId || pollId;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (targetId && uuidRegex.test(targetId)) {
        const res = await fetch(`/api/polls/${targetId}`, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.data) setCurrentPollAnalytics(json.data);
        }
      }

      // 2. Fetch all project polls
      const allRes = await fetch("/api/polls", { headers });
      if (allRes.ok) {
        const allJson = await allRes.json();
        if (Array.isArray(allJson.data)) {
          setAllProjectPolls(allJson.data);
          if (!currentPollAnalytics && allJson.data.length > 0) {
            const found = allJson.data.find((p: any) => p.id === targetId) || allJson.data[0];
            setCurrentPollAnalytics(found);
          }
        }
      }
    } catch (e) {
      console.warn("Error loading poll analytics:", e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const openEditModal = (initialTab: "edit" | "analytics" = "edit") => {
    setModalQuestion(question);
    setModalDescription(description || "");
    setModalOptions([...options]);
    setModalShowResults(showResults);
    setModalAllowAnonymous(allowAnonymous);
    setModalClosesAt(closesAt || "");
    setModalAlign(layout || align || "center");
    setModalWidth(width || "100%");
    setModalActiveTab(initialTab);
    setSelectedAnalyticsPollId(pollId || null);
    setIsEditModalOpen(true);

    if (initialTab === "analytics") {
      fetchAnalytics();
    }
  };

  const handleSaveModal = () => {
    const cleanOpts = modalOptions.filter((o) => o.label.trim().length > 0);
    const finalOpts = cleanOpts.length >= 2 ? cleanOpts : [
      { id: "1", label: "Option A" },
      { id: "2", label: "Option B" },
    ];

    updateAttributes({
      question: modalQuestion.trim() || "What do you think?",
      description: modalDescription.slice(0, 500),
      options: finalOpts,
      type: "single",
      showResults: modalShowResults,
      allowAnonymous: modalAllowAnonymous,
      closesAt: modalClosesAt ? new Date(modalClosesAt).toISOString() : null,
      align: modalAlign,
      layout: modalAlign,
      width: modalWidth,
      pollId: pollId ?? `poll_${Date.now()}`,
    });

    setOptions(finalOpts);
    setIsEditModalOpen(false);
  };

  // Delete node and ensure Supabase DB deletion if poll exists
  const handleDeletePoll = async () => {
    const targetPollId = pollId;
    deleteNode();

    if (targetPollId) {
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const headers: Record<string, string> = {};
      if (activeProjId) headers["X-OpenPost-Project"] = activeProjId;

      fetch(`/api/polls/${targetPollId}`, {
        method: "DELETE",
        headers,
      }).catch((e) => {
        console.warn("Poll delete error:", e);
      });
    }
  };

  // Drag-to-resize from Right edge/corners
  const onResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const container = (e.currentTarget as HTMLElement).closest(".relative.group") as HTMLElement | null;
    const parentW = container?.parentElement?.clientWidth || 700;
    const startWidthPx = container ? container.offsetWidth : parentW;

    const onMove = (ev: MouseEvent) => {
      ev.preventDefault();
      const deltaX = ev.clientX - startX;
      const newPx = Math.min(parentW, Math.max(200, startWidthPx + deltaX));
      const nextPct = Math.min(100, Math.max(25, Math.round((newPx / parentW) * 100)));
      updateAttributes({ width: `${nextPct}%` });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Drag-to-resize from Left edge/corners
  const onResizeLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const container = (e.currentTarget as HTMLElement).closest(".relative.group") as HTMLElement | null;
    const parentW = container?.parentElement?.clientWidth || 700;
    const startWidthPx = container ? container.offsetWidth : parentW;

    const onMove = (ev: MouseEvent) => {
      ev.preventDefault();
      const deltaX = startX - ev.clientX;
      const newPx = Math.min(parentW, Math.max(200, startWidthPx + deltaX));
      const nextPct = Math.min(100, Math.max(25, Math.round((newPx / parentW) * 100)));
      updateAttributes({ width: `${nextPct}%` });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const currentLayout = layout || align || "center";

  const wrapperClass =
    currentLayout === "left"
      ? "image-align-left float-left mr-8 mb-4 clear-none inline-block"
      : currentLayout === "right"
      ? "image-align-right float-right ml-8 mb-4 clear-none inline-block"
      : currentLayout === "wide"
      ? "image-align-wide block w-full my-8 clear-both"
      : "image-align-center block w-full my-8 clear-both";

  const innerMarginCls =
    currentLayout === "left"
      ? "mr-auto ml-0"
      : currentLayout === "right"
      ? "ml-auto mr-0"
      : currentLayout === "wide"
      ? "w-full mx-0"
      : "mx-auto";

  const currentWidthVal = width || "100%";
  const widthStyle = { width: currentWidthVal, maxWidth: "100%" };

  const layouts = [
    { key: "left", label: "Left (Wrap)", icon: AlignLeft },
    { key: "center", label: "Center", icon: AlignCenter },
    { key: "right", label: "Right (Wrap)", icon: AlignRight },
    { key: "wide", label: "Full Width", icon: Maximize2 },
  ] as const;

  const sizePresets = ["50%", "75%", "100%"];
  const activeColor = "#FEA611";

  return (
    <NodeViewWrapper className={`my-6 ${wrapperClass} transition-all select-none`}>
      <div className={`relative group ${innerMarginCls}`} style={widthStyle as any}>
        {/* Main Poll Card Box — Sharp Non-Rounded Corners with full 4-sided yellow border */}
        <div
          className={`relative rounded-none bg-white p-5 sm:p-6 shadow-xs transition overflow-visible ${
            selected
              ? "ring-2 ring-brand/50 shadow-md"
              : "hover:shadow-sm"
          }`}
          style={{ border: "2px solid #FEA611" }}
        >
          {/* Top Left Drag Move Handle */}
          <div
            draggable
            data-drag-handle
            className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 rounded-none bg-white/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-navy border border-border shadow-xs cursor-grab active:cursor-grabbing select-none opacity-0 group-hover:opacity-100 transition"
            title="Drag to reposition poll anywhere in text"
          >
            <GripVertical className="h-3 w-3 text-brand" />
            <span>Move</span>
          </div>

          {/* Header Row */}
          <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-border/70 pl-16">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-none shadow-2xs text-white"
                style={{ backgroundColor: activeColor }}
              >
                <BarChart3 className="h-3.5 w-3.5 text-navy font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-navy">
                    Reader Poll
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openEditModal("analytics")}
                className="inline-flex items-center gap-1 rounded-none border border-border bg-surface-raised px-2.5 py-1 text-[11px] font-bold text-navy hover:bg-slate-100 transition shadow-2xs"
                title="View real-time poll analytics and responses"
              >
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                <span className="hidden sm:inline">Analytics</span>
              </button>
              <button
                type="button"
                onClick={() => openEditModal("edit")}
                className="inline-flex items-center gap-1 rounded-none border border-border bg-surface-raised px-2.5 py-1 text-[11px] font-bold text-navy hover:bg-slate-100 transition shadow-2xs"
                title="Edit Poll question, description, options, and settings"
              >
                <Edit3 className="h-3 w-3 text-brand" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={handleDeletePoll}
                className="flex h-7 w-7 items-center justify-center rounded-none border border-border text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition"
                title="Delete Poll from post and database"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Question: Refined Text Size (Clean, Compact, High-Impact) */}
          <h3 className="text-sm sm:text-base font-bold text-navy leading-snug tracking-tight mb-2">
            {question || "What do you think?"}
          </h3>

          {/* 500-Character Description */}
          {description && (
            <p className="text-xs text-slate-600 font-normal leading-relaxed mb-4 bg-slate-50 border border-slate-100 rounded-none p-3">
              {description}
            </p>
          )}

          {/* Option List Preview */}
          <div className="space-y-2 my-3">
            {options.map((opt, idx) => (
              <div
                key={opt.id || idx}
                className="relative flex items-center justify-between rounded-none border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-navy hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-3.5 w-3.5 items-center justify-center border border-slate-300 bg-white rounded-none"
                  >
                    <div
                      className="h-1.5 w-1.5"
                      style={{ backgroundColor: activeColor }}
                    />
                  </div>
                  <span>{opt.label || `Option ${idx + 1}`}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">0%</span>
              </div>
            ))}
          </div>

          {/* Footer Metadata */}
          <div className="mt-4 pt-3 border-t border-border/70 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-none font-bold border border-emerald-200/60">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Anti-Fraud Protected
              </span>
              {closesAt && (
                <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-none font-semibold border border-amber-200/60">
                  <Clock className="h-3 w-3" />
                  Closes {new Date(closesAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <span className="text-slate-400">
              Live reader voting enabled on published post
            </span>
          </div>

          {/* 6-POINT SQUARE RESIZE BLOCKS (Figma / Canva style drag handles) */}
          <div
            onMouseDown={onResizeLeft}
            className="absolute -top-1.5 -left-1.5 h-4 w-4 bg-white border-2 shadow-md z-30 cursor-nwse-resize rounded-none hover:scale-125 hover:bg-brand transition-transform select-none"
            style={{ borderColor: activeColor }}
            title="Drag to resize width"
          />
          <div
            onMouseDown={onResizeRight}
            className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-white border-2 shadow-md z-30 cursor-nesw-resize rounded-none hover:scale-125 hover:bg-brand transition-transform select-none"
            style={{ borderColor: activeColor }}
            title="Drag to resize width"
          />
          <div
            onMouseDown={onResizeLeft}
            className="absolute -bottom-1.5 -left-1.5 h-4 w-4 bg-white border-2 shadow-md z-30 cursor-nesw-resize rounded-none hover:scale-125 hover:bg-brand transition-transform select-none"
            style={{ borderColor: activeColor }}
            title="Drag to resize width"
          />
          <div
            onMouseDown={onResizeRight}
            className="absolute -bottom-1.5 -right-1.5 h-4 w-4 bg-white border-2 shadow-md z-30 cursor-nwse-resize rounded-none hover:scale-125 hover:bg-brand transition-transform select-none"
            style={{ borderColor: activeColor }}
            title="Drag to resize width"
          />
          <div
            onMouseDown={onResizeLeft}
            className="absolute top-1/2 -left-2 -translate-y-1/2 h-4 w-4 bg-white border-2 shadow-md z-30 cursor-ew-resize rounded-none hover:scale-125 hover:bg-brand transition-transform select-none"
            style={{ borderColor: activeColor }}
            title="Drag to resize width"
          />
          <div
            onMouseDown={onResizeRight}
            className="absolute top-1/2 -right-2 -translate-y-1/2 h-4 w-4 bg-white border-2 shadow-md z-30 cursor-ew-resize rounded-none hover:scale-125 hover:bg-brand transition-transform select-none"
            style={{ borderColor: activeColor }}
            title="Drag to resize width"
          />
        </div>

        {/* SLEEK FLOATING TOOLBAR UNDER CARD */}
        <div className="flex justify-center pt-2">
          <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-border bg-white/98 px-3 py-1.5 shadow-md backdrop-blur-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-150 select-none">
            {/* Alignment buttons */}
            <div className="flex items-center gap-0.5">
              {layouts.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => updateAttributes({ layout: l.key, align: l.key })}
                  className={`flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-bold transition ${
                    currentLayout === l.key
                      ? "bg-navy text-white shadow-2xs"
                      : "text-navy hover:bg-surface-raised"
                  }`}
                  title={`Align: ${l.label}`}
                >
                  <l.icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{l.key.charAt(0).toUpperCase() + l.key.slice(1)}</span>
                </button>
              ))}
            </div>

            <div className="h-3.5 w-[1px] bg-border mx-0.5" />

            {/* Size presets */}
            <div className="flex items-center gap-0.5">
              {sizePresets.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => updateAttributes({ width: sz })}
                  className={`h-7 px-2 rounded-full text-[10px] font-mono font-bold transition ${
                    currentWidthVal === sz
                      ? "bg-navy text-white shadow-2xs font-extrabold"
                      : "text-navy hover:bg-surface-raised"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            <div className="h-3.5 w-[1px] bg-border mx-0.5" />

            {/* Quick Analytics & Edit buttons */}
            <button
              type="button"
              onClick={() => openEditModal("analytics")}
              className="flex h-7 items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
            >
              <TrendingUp className="h-3 w-3" />
              <span>Analytics</span>
            </button>
            <button
              type="button"
              onClick={() => openEditModal("edit")}
              className="flex h-7 items-center gap-1 rounded-full bg-brand/10 border border-brand/20 px-2.5 text-[11px] font-bold text-brand hover:bg-brand hover:text-navy transition shadow-2xs"
            >
              <Edit3 className="h-3 w-3" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* FULL EDIT & ANALYTICS MODAL / CARD */}
      {isEditModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-navy/60 backdrop-blur-xs p-4 overflow-y-auto [scrollbar-width:thin]"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsEditModalOpen(false);
            }}
          >
            <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden text-navy">
              {/* Modal Top Header */}
              <div className="p-6 pb-0 border-b border-border bg-white shrink-0">
                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/20 text-navy shadow-xs font-bold">
                      <BarChart3 className="h-5 w-5 text-navy" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-navy">Poll Management &amp; Analytics</h2>
                      <p className="text-xs text-text-tertiary">
                        Create questions, configure choices, and monitor voter engagement
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="rounded-xl border border-border p-2 text-text-tertiary hover:bg-surface-raised hover:text-navy transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Top Two Tabs: Create Polls / Edit vs Analytics */}
                <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-dim border border-border text-center font-bold text-xs mb-4">
                  <button
                    type="button"
                    onClick={() => setModalActiveTab("edit")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                      modalActiveTab === "edit"
                        ? "bg-white text-navy shadow-xs font-black"
                        : "text-text-tertiary hover:text-navy"
                    }`}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Create &amp; Edit Poll</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalActiveTab("analytics");
                      fetchAnalytics();
                    }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                      modalActiveTab === "analytics"
                        ? "bg-white text-navy shadow-xs font-black"
                        : "text-text-tertiary hover:text-navy"
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Poll Analytics</span>
                  </button>
                </div>
              </div>

              {/* Modal Body Container with sleek scrollbar */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                {/* 1. EDIT POLL TAB */}
                {modalActiveTab === "edit" && (
                  <div className="space-y-5">
                    {/* Poll Question */}
                    <div>
                      <label className="block text-xs font-bold text-navy mb-1.5">
                        Poll Question <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Which web framework do you prefer for production?"
                        value={modalQuestion}
                        onChange={(e) => setModalQuestion(e.target.value)}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy font-semibold focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none shadow-2xs"
                      />
                    </div>

                    {/* Context / Description (500 chars) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-navy">
                          Context / Description (Optional)
                        </label>
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            modalDescription.length > 450 ? "text-amber-600 font-extrabold" : "text-text-tertiary"
                          }`}
                        >
                          {modalDescription.length} / 500 characters
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        maxLength={500}
                        placeholder="Add background context, instructions, or caveats for voters (max 500 characters)..."
                        value={modalDescription}
                        onChange={(e) => setModalDescription(e.target.value)}
                        className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy font-normal leading-relaxed focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none shadow-2xs resize-none"
                      />
                    </div>

                    {/* Options Manager */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-navy">
                          Poll Options <span className="text-rose-500">*</span> (min 2)
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setModalOptions([
                              ...modalOptions,
                              { id: Date.now().toString(), label: `Option ${modalOptions.length + 1}` },
                            ])
                          }
                          className="inline-flex items-center gap-1 rounded-xl bg-brand/10 border border-brand/20 px-2.5 py-1 text-xs font-bold text-brand hover:bg-brand hover:text-navy transition shadow-2xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Option</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {modalOptions.map((opt, idx) => (
                          <div
                            key={opt.id || idx}
                            className="flex items-center gap-2 rounded-xl border border-border bg-[#F9FAFB] p-2"
                          >
                            <span className="text-xs font-bold text-text-tertiary w-5 text-center">
                              {idx + 1}.
                            </span>
                            <input
                              type="text"
                              value={opt.label}
                              placeholder={`Option ${idx + 1}`}
                              onChange={(e) => {
                                const updated = [...modalOptions];
                                updated[idx] = { ...opt, label: e.target.value };
                                setModalOptions(updated);
                              }}
                              className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-navy font-medium focus:border-brand focus:outline-none"
                            />
                            {modalOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setModalOptions(modalOptions.filter((_, i) => i !== idx))
                                }
                                className="p-1.5 text-text-tertiary hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Remove option"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Poll Configuration Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                      {/* Results Visibility */}
                      <div>
                        <label className="block text-xs font-bold text-navy mb-1.5">
                          Results Visibility
                        </label>
                        <select
                          value={modalShowResults}
                          onChange={(e) => setModalShowResults(e.target.value as any)}
                          className="w-full h-9 rounded-xl border border-border bg-white px-3 text-xs text-navy font-semibold focus:border-brand focus:outline-none cursor-pointer shadow-2xs"
                        >
                          <option value="always">Always Visible (Before &amp; After Voting)</option>
                          <option value="after_vote">Show Only After User Votes</option>
                          <option value="after_close">Show Only When Poll Closes</option>
                        </select>
                      </div>

                      {/* Poll Close Date */}
                      <div>
                        <label className="block text-xs font-bold text-navy mb-1.5">
                          Poll Close Date (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={
                            modalClosesAt
                              ? new Date(modalClosesAt).toISOString().slice(0, 16)
                              : ""
                          }
                          onChange={(e) => setModalClosesAt(e.target.value)}
                          className="w-full h-9 rounded-xl border border-border bg-white px-3 text-xs text-navy font-semibold focus:border-brand focus:outline-none cursor-pointer shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Anti-Fraud Protection */}
                    <div className="pt-2 border-t border-border">
                      <div>
                        <label className="block text-xs font-bold text-navy mb-1.5">
                          Anti-Fraud Protection
                        </label>
                        <div
                          onClick={() => setModalAllowAnonymous(!modalAllowAnonymous)}
                          className={`cursor-pointer p-2.5 rounded-xl border transition flex items-start gap-2.5 ${
                            modalAllowAnonymous
                              ? "border-emerald-200 bg-emerald-50/70"
                              : "border-border bg-white"
                          }`}
                        >
                          <ShieldCheck
                            className={`h-4 w-4 mt-0.5 ${
                              modalAllowAnonymous ? "text-emerald-600" : "text-slate-400"
                            }`}
                          />
                          <div>
                            <p className="text-xs font-bold text-navy">
                              IP &amp; Cookie Fingerprinting
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {modalAllowAnonymous
                                ? "Enabled — 1 vote per guest/IP/browser"
                                : "Disabled — unlimited voting"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>



                    {/* Alignment & Layout Presets */}
                    <div className="pt-2 border-t border-border">
                      <label className="block text-xs font-bold text-navy mb-1.5">
                        Card Alignment &amp; Text Wrapping
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {layouts.map((l) => (
                          <button
                            key={l.key}
                            type="button"
                            onClick={() => setModalAlign(l.key)}
                            className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              modalAlign === l.key
                                ? "border-brand bg-brand/15 text-navy shadow-2xs"
                                : "border-border bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <l.icon className="h-3.5 w-3.5" />
                            <span>{l.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. POLL ANALYTICS TAB */}
                {modalActiveTab === "analytics" && (
                  <div className="space-y-5">
                    {/* Header & Refresh */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-navy flex items-center gap-2">
                          <Activity className="h-4 w-4 text-emerald-600" />
                          Live Poll Response Analytics
                        </h4>
                        <p className="text-[11px] text-text-tertiary">
                          Real-time breakdown of votes, percentages, and anti-fraud voter verification
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={fetchAnalytics}
                        disabled={analyticsLoading}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-raised px-3 py-1.5 text-xs font-bold text-navy hover:bg-slate-100 transition shadow-2xs"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${analyticsLoading ? "animate-spin text-brand" : ""}`} />
                        <span>Refresh</span>
                      </button>
                    </div>

                    {/* Poll Selector if multiple project polls exist */}
                    {allProjectPolls.length > 1 && (
                      <div>
                        <label className="block text-xs font-bold text-navy mb-1.5">
                          Select Project Poll to Inspect:
                        </label>
                        <select
                          value={selectedAnalyticsPollId || ""}
                          onChange={(e) => {
                            const newId = e.target.value;
                            setSelectedAnalyticsPollId(newId);
                            const found = allProjectPolls.find((p) => p.id === newId);
                            if (found) setCurrentPollAnalytics(found);
                          }}
                          className="w-full h-9 rounded-xl border border-border bg-white px-3 text-xs text-navy font-semibold focus:border-brand focus:outline-none cursor-pointer shadow-2xs"
                        >
                          {allProjectPolls.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.question} ({p.totalVotes || 0} votes) — {p.status}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {analyticsLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin text-brand" />
                        <span className="text-xs font-semibold">Loading live voter analytics...</span>
                      </div>
                    ) : currentPollAnalytics ? (
                      <div className="space-y-4">
                        {/* Summary Metrics Cards */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-xl border border-border bg-slate-50/70 p-3.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Total Votes</span>
                            <p className="text-xl font-black text-navy mt-1">
                              {currentPollAnalytics.totalVotes ?? 0}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border bg-slate-50/70 p-3.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Poll Status</span>
                            <p className="text-xs font-black capitalize text-navy mt-1.5 flex items-center gap-1.5">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  currentPollAnalytics.status === "open"
                                    ? "bg-emerald-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              {currentPollAnalytics.status || "Draft / Open"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border bg-slate-50/70 p-3.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Fraud Guard</span>
                            <p className="text-xs font-bold text-emerald-700 mt-1.5 flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                              Cookie &amp; IP
                            </p>
                          </div>
                        </div>

                        {/* Visual Breakdown Bar Chart */}
                        <div className="rounded-xl border border-border bg-white p-4 shadow-2xs space-y-3">
                          <h5 className="text-xs font-bold text-navy">
                            Option Breakdown: {currentPollAnalytics.question}
                          </h5>

                          <div className="space-y-3">
                            {(currentPollAnalytics.options || []).map((opt: any, idx: number) => {
                              const pct = opt.percentage ?? (currentPollAnalytics.totalVotes > 0 ? Math.round((opt.votes / currentPollAnalytics.totalVotes) * 100) : 0);
                              return (
                                <div key={opt.id || idx} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs font-bold text-navy">
                                    <span>{opt.label}</span>
                                    <span className="font-mono text-slate-500">
                                      {pct}% ({opt.votes ?? 0} votes)
                                    </span>
                                  </div>
                                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500 bg-brand"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Recent Voter Logs */}
                        {currentPollAnalytics.recentVotes && currentPollAnalytics.recentVotes.length > 0 && (
                          <div className="rounded-xl border border-border bg-white p-4 shadow-2xs">
                            <h5 className="text-xs font-bold text-navy mb-2 flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-slate-500" />
                              Recent Voter Activity (Fraud-Masked)
                            </h5>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto [scrollbar-width:thin]">
                              {currentPollAnalytics.recentVotes.map((v: any) => (
                                <div
                                  key={v.id}
                                  className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 last:border-0"
                                >
                                  <span className="font-mono text-slate-600">
                                    Fingerprint: {v.voterPreview}
                                  </span>
                                  <span className="text-slate-400">
                                    {new Date(v.votedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-slate-50">
                        <BarChart3 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-navy">No Poll Responses Yet</p>
                        <p className="text-[11px] text-text-tertiary mt-1">
                          Publish the article to allow readers to vote with real-time cookie &amp; IP anti-fraud protection.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-border bg-white flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={handleDeletePoll}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Poll from DB</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-navy hover:bg-surface-raised transition"
                  >
                    Cancel
                  </button>
                  {modalActiveTab === "edit" ? (
                    <button
                      type="button"
                      onClick={handleSaveModal}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-xs font-bold text-navy hover:bg-brand-hover hover:text-white transition shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Save Changes
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModalActiveTab("edit")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-5 py-2 text-xs font-bold text-white hover:bg-navy-light transition shadow-xs"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit Question &amp; Options
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </NodeViewWrapper>
  );
}
