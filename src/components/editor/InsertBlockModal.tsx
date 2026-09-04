"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/core";
import {
  Image as ImageIcon,
  BarChart3,
  Sparkles,
  Table as TableIcon,
  HelpCircle,
  Layers,
  Globe,
  ArrowUpRight,
  Download,
  Upload,
  Link2,
  X,
  Plus,
  Trash2,
  Check,
  Loader2,
  Library,
  Video,
  FileText,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Play,
  Tv,
  Monitor,
  Smartphone,
  Square,
  Film,
  Palette,
  TrendingUp,
  RefreshCw,
  Users,
  Activity,
} from "lucide-react";
import { parseVideoUrl } from "./YouTubeBlockView";

export type BlockModalType =
  | "image"
  | "poll"
  | "callout"
  | "table"
  | "faq"
  | "accordion"
  | "video"
  | "youtube"
  | "button"
  | "download"
  | null;

interface InsertBlockModalProps {
  type: BlockModalType;
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
}

export function InsertBlockModal({
  type,
  isOpen,
  onClose,
  editor,
}: InsertBlockModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  // Image State
  const [imageTab, setImageTab] = useState<"upload" | "url" | "library">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [imageLayout, setImageLayout] = useState<"left" | "center" | "right" | "wide">("center");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Poll State
  const [pollTab, setPollTab] = useState<"create" | "analytics">("create");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [pollOptions, setPollOptions] = useState(["Option 1", "Option 2"]);
  const [pollShowResults, setPollShowResults] = useState<"always" | "after_vote" | "after_close">("always");
  const [pollAllowAnonymous, setPollAllowAnonymous] = useState(true);
  const [pollClosesAt, setPollClosesAt] = useState("");
  const [pollAlign, setPollAlign] = useState<"left" | "center" | "right" | "wide">("center");
  const [projectPolls, setProjectPolls] = useState<any[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(false);

  // Video State
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [videoAspectRatio, setVideoAspectRatio] = useState<"16:9" | "4:3" | "1:1" | "9:16">("16:9");
  const [videoAlign, setVideoAlign] = useState<"left" | "center" | "right" | "wide">("center");
  const [videoWidth, setVideoWidth] = useState("100%");
  const [videoStartTime, setVideoStartTime] = useState("");
  const [videoAutoplay, setVideoAutoplay] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoLoop, setVideoLoop] = useState(false);
  const [videoControls, setVideoControls] = useState(true);
  const [videoPrivacy, setVideoPrivacy] = useState(true);

  // Button State
  const [buttonText, setButtonText] = useState("Explore More");
  const [buttonUrl, setButtonUrl] = useState("https://");
  const [buttonVariant, setButtonVariant] = useState<"primary" | "dark" | "outline">("primary");

  // Callout State
  const [calloutTone, setCalloutTone] = useState<"tip" | "info" | "warning" | "success">("tip");
  const [calloutText, setCalloutText] = useState("Key takeaway or essential tip for readers.");

  // Table State
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // FAQ State
  const [faqItems, setFaqItems] = useState([
    { question: "What is this topic about?", answer: "Comprehensive answer explaining the details clearly." },
  ]);

  // Download State
  const [downloadName, setDownloadName] = useState("CheatSheet.pdf");
  const [downloadUrl, setDownloadUrl] = useState("https://");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Media Library on open if image modal
  useEffect(() => {
    if (isOpen && type === "image") {
      setLoadingMedia(true);
      fetch("/api/media?limit=24")
        .then((r) => r.json())
        .then((res) => {
          if (Array.isArray(res.data)) setMediaLibrary(res.data);
        })
        .catch(() => {})
        .finally(() => setLoadingMedia(false));
    }
    if (isOpen && type === "poll") {
      setLoadingPolls(true);
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const headers: Record<string, string> = {};
      if (activeProjId) headers["X-OpenPost-Project"] = activeProjId;
      fetch("/api/polls", { headers })
        .then((r) => r.json())
        .then((res) => {
          if (Array.isArray(res.data)) setProjectPolls(res.data);
        })
        .catch(() => {})
        .finally(() => setLoadingPolls(false));
    }
  }, [isOpen, type]);

  if (!isOpen || !type || !editor) return null;

  // Handle File Upload: Client-side convert to WebP before upload!
  const handleFileUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const { uploadImageWithWebP } = await import("@/lib/uploadMedia");
      const { url } = await uploadImageWithWebP(file);
      setImageUrl(url);
      if (!imageAlt) {
        setImageAlt(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
    } catch (err: any) {
      alert("Image upload error: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit Handlers
  const handleInsertImage = () => {
    if (!imageUrl) return;
    editor
      .chain()
      .focus()
      .setImage({
        src: imageUrl,
        alt: imageAlt || undefined,
        caption: imageCaption || undefined,
        layout: imageLayout,
        align: imageLayout,
      } as any)
      .run();
    onClose();
  };

  const handleInsertPoll = () => {
    if (!pollQuestion.trim()) {
      alert("Please provide a poll question");
      return;
    }
    const cleanOpts = pollOptions.filter((o) => o.trim().length > 0);
    if (cleanOpts.length < 2) {
      alert("Please provide at least 2 poll options");
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: "pollBlock",
        attrs: {
          pollId: `poll_${Date.now()}`,
          question: pollQuestion.trim(),
          description: pollDescription.trim().slice(0, 500),
          options: cleanOpts.map((label, idx) => ({ id: `opt_${idx + 1}`, label })),
          type: "single",
          showResults: pollShowResults,
          allowAnonymous: pollAllowAnonymous,
          closesAt: pollClosesAt ? new Date(pollClosesAt).toISOString() : null,
          align: pollAlign,
          layout: pollAlign,
          width: "100%",
          status: "open",
        },
      })
      .run();
    onClose();
  };

  const handleInsertCallout = () => {
    const text = calloutText.trim() || "Key takeaway or essential tip for readers.";
    editor
      .chain()
      .focus()
      .insertContent({
        type: "callout",
        attrs: { tone: calloutTone },
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text }],
          },
        ],
      })
      .run();
    onClose();
  };

  const handleInsertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({
        rows: Math.max(1, tableRows),
        cols: Math.max(1, tableCols),
        withHeaderRow: true,
      })
      .run();
    onClose();
  };

  const handleInsertVideo = () => {
    if (!videoUrl.trim() || !editor) return;
    const parsed = parseVideoUrl(videoUrl.trim());
    if (!parsed) {
      alert("Please enter a valid YouTube, Vimeo, or video URL.");
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: "videoBlock",
        attrs: {
          src: videoUrl.trim(),
          url: videoUrl.trim(),
          videoId: parsed.videoId,
          provider: parsed.provider,
          title: videoTitle.trim(),
          caption: videoCaption.trim(),
          aspectRatio: videoAspectRatio,
          align: videoAlign,
          layout: videoAlign,
          width: videoWidth,
          startTime: videoStartTime,
          autoplay: videoAutoplay,
          muted: videoMuted,
          loop: videoLoop,
          controls: videoControls,
          privacyEnhanced: videoPrivacy,
        },
      })
      .run();
    onClose();
  };

  const handleInsertButton = () => {
    if (!buttonText || !buttonUrl) return;
    const styles = {
      primary: "background: #FEA611; color: #2D3440; font-weight: 800;",
      dark: "background: #2D3440; color: #FFFFFF; font-weight: 700;",
      outline:
        "background: transparent; color: #2D3440; border: 2px solid #2D3440; font-weight: 700;",
    };

    const btnHtml = `
      <p style="margin: 20px 0; text-align: center;">
        <a href="${buttonUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); ${styles[buttonVariant]}">
          ${buttonText} →
        </a>
      </p>
    `;

    editor.chain().focus().insertContent(btnHtml).run();
    onClose();
  };

  const handleInsertFaq = () => {
    (editor.chain().focus() as any).setFaq({ items: faqItems }).run();
    onClose();
  };

  const handleInsertDownload = () => {
    if (!downloadName || !downloadUrl) return;
    const downloadHtml = `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-radius: 14px; border: 1px solid #E2E8F0; background: #F8FAFC; margin: 20px 0;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 20px;">📁</span>
          <div>
            <p style="font-weight: 700; font-size: 13px; color: #2D3440; margin: 0;">${downloadName}</p>
            <p style="font-size: 11px; color: #64748B; margin: 2px 0 0 0;">Downloadable Resource</p>
          </div>
        </div>
        <a href="${downloadUrl}" target="_blank" download style="display: inline-flex; align-items: center; padding: 8px 16px; border-radius: 10px; background: #2D3440; color: #FFFFFF; font-size: 12px; font-weight: 700; text-decoration: none;">
          Download ↓
        </a>
      </div>
    `;

    editor.chain().focus().insertContent(downloadHtml).run();
    onClose();
  };

  if (!isOpen || !mounted || !type) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4 animate-in fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 text-navy relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/15 text-navy">
              {type === "image" && <ImageIcon className="h-4 w-4" />}
              {type === "poll" && <BarChart3 className="h-4 w-4" />}
              {type === "callout" && <Sparkles className="h-4 w-4" />}
              {type === "table" && <TableIcon className="h-4 w-4" />}
              {(type === "video" || type === "youtube") && <Video className="h-4 w-4" />}
              {type === "button" && <ArrowUpRight className="h-4 w-4" />}
              {type === "faq" && <HelpCircle className="h-4 w-4" />}
              {type === "download" && <Download className="h-4 w-4" />}
            </span>
            <h3 className="text-sm font-extrabold text-navy capitalize">
              {type === "image" && "Insert Image Asset (Auto WebP)"}
              {type === "poll" && "Create Interactive Reader Poll"}
              {type === "callout" && "Insert Editorial Callout Box"}
              {type === "table" && "Insert Data Table"}
              {(type === "video" || type === "youtube") && "Embed Video (YouTube / Vimeo / Shorts)"}
              {type === "button" && "Insert Call-to-Action Button"}
              {type === "faq" && "Insert FAQ Structured Accordion"}
              {type === "download" && "Insert Downloadable Attachment"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary hover:bg-surface-raised hover:text-navy"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 text-xs space-y-4 max-h-[65vh] overflow-y-auto">
          {/* 1. IMAGE MODAL */}
          {type === "image" && (
            <div className="space-y-4">
              {/* Tabs: Upload / URL / Media Library */}
              <div className="grid grid-cols-3 p-1 rounded-xl bg-surface-dim border border-border text-center font-bold">
                <button
                  type="button"
                  onClick={() => setImageTab("upload")}
                  className={`py-1.5 rounded-lg transition ${
                    imageTab === "upload"
                      ? "bg-white text-navy shadow-xs"
                      : "text-text-tertiary"
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab("url")}
                  className={`py-1.5 rounded-lg transition ${
                    imageTab === "url"
                      ? "bg-white text-navy shadow-xs"
                      : "text-text-tertiary"
                  }`}
                >
                  Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab("library")}
                  className={`py-1.5 rounded-lg transition ${
                    imageTab === "library"
                      ? "bg-white text-navy shadow-xs"
                      : "text-text-tertiary"
                  }`}
                >
                  Media Library
                </button>
              </div>

              {imageTab === "upload" && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer rounded-2xl border-2 border-dashed border-border bg-[#F9FAFB] p-8 text-center hover:border-brand hover:bg-brand/5 transition"
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-brand" />
                        <p className="font-bold text-navy">
                          Converting to WebP &amp; uploading...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/15 text-navy">
                          <Upload className="h-6 w-6" />
                        </div>
                        <p className="font-bold text-navy text-sm">
                          Click to choose image or drag &amp; drop
                        </p>
                        <p className="text-text-tertiary text-[11px]">
                          Automatically converted to optimized WebP in browser before upload
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {imageTab === "url" && (
                <div>
                  <label className="block font-bold text-navy mb-1">Direct Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                </div>
              )}

              {imageTab === "library" && (
                <div>
                  <p className="font-bold text-navy mb-2">Select from Uploaded Media</p>
                  {loadingMedia ? (
                    <div className="p-8 text-center text-text-tertiary">Loading library...</div>
                  ) : mediaLibrary.length === 0 ? (
                    <p className="p-6 text-center text-text-tertiary border rounded-xl">
                      No media items found. Upload one first!
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                      {mediaLibrary.map((item) => {
                        const url = item.variants?.publicUrl || item.url;
                        const isSelected = imageUrl === url;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setImageUrl(url);
                              if (item.altTextDefault) setImageAlt(item.altTextDefault);
                            }}
                            className={`cursor-pointer relative rounded-xl overflow-hidden border aspect-video transition ${
                              isSelected
                                ? "border-brand ring-2 ring-brand"
                                : "border-border hover:opacity-80"
                            }`}
                          >
                            <img
                              src={url}
                              alt={item.originalFilename}
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-brand/20 flex items-center justify-center">
                                <Check className="h-4 w-4 text-navy font-bold" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Layout Alignment Selector (Left, Center, Right, Wide) */}
              <div>
                <label className="block font-bold text-navy mb-1.5">
                  Text Wrapping &amp; Alignment
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "left", label: "Left (Wrap)", icon: AlignLeft },
                    { id: "center", label: "Center", icon: AlignCenter },
                    { id: "right", label: "Right (Wrap)", icon: AlignRight },
                    { id: "wide", label: "Wide Card", icon: Maximize2 },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setImageLayout(pos.id as any)}
                      className={`flex items-center justify-center gap-1 py-2 rounded-xl border text-[11px] font-bold transition ${
                        imageLayout === pos.id
                          ? "border-brand bg-brand/15 text-navy shadow-xs"
                          : "border-border hover:bg-surface-dim text-text-secondary"
                      }`}
                    >
                      <pos.icon className="h-3 w-3" />
                      <span>{pos.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-text-tertiary mt-1">
                  Left &amp; Right modes wrap surrounding paragraphs around the image like MS Word.
                </p>
              </div>

              {imageUrl && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-3">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-14 w-20 object-cover rounded-lg border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-navy truncate">{imageUrl}</p>
                      <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Ready to insert
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-navy mb-1">
                      Alt Text (SEO &amp; Accessibility)
                    </label>
                    <input
                      type="text"
                      placeholder="Descriptive explanation of the visual"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. POLL MODAL */}
          {type === "poll" && (
            <div className="space-y-4">
              {/* Poll Modal Top Sub-Tabs: Create Poll vs Analytics */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-dim border border-border text-center font-bold">
                <button
                  type="button"
                  onClick={() => setPollTab("create")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
                    pollTab === "create"
                      ? "bg-white text-navy shadow-xs font-black"
                      : "text-text-tertiary hover:text-navy"
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Poll</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPollTab("analytics");
                    const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
                    const headers: Record<string, string> = {};
                    if (activeProjId) headers["X-OpenPost-Project"] = activeProjId;
                    setLoadingPolls(true);
                    fetch("/api/polls", { headers })
                      .then((r) => r.json())
                      .then((res) => {
                        if (Array.isArray(res.data)) setProjectPolls(res.data);
                      })
                      .catch(() => {})
                      .finally(() => setLoadingPolls(false));
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
                    pollTab === "analytics"
                      ? "bg-white text-navy shadow-xs font-black"
                      : "text-text-tertiary hover:text-navy"
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Poll Analytics</span>
                </button>
              </div>

              {pollTab === "create" && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1.5">
                      Poll Question <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Which web framework do you prefer for production?"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy font-semibold focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-navy">
                        Context / Description (Optional)
                      </label>
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          pollDescription.length > 450 ? "text-amber-600 font-extrabold" : "text-text-tertiary"
                        }`}
                      >
                        {pollDescription.length} / 500 characters
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={500}
                      placeholder="Add optional background context, instructions, or caveats for voters (max 500 characters)..."
                      value={pollDescription}
                      onChange={(e) => setPollDescription(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-navy font-normal leading-relaxed focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none shadow-2xs resize-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-navy">
                        Poll Options <span className="text-rose-500">*</span> (min 2)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`])
                        }
                        className="inline-flex items-center gap-1 rounded-xl bg-brand/10 border border-brand/20 px-2.5 py-1 text-xs font-bold text-brand hover:bg-brand hover:text-navy transition shadow-2xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Option</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {pollOptions.map((opt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-xl border border-border bg-[#F9FAFB] p-2"
                        >
                          <span className="text-xs font-bold text-text-tertiary w-5 text-center">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={opt}
                            placeholder={`Option ${idx + 1}`}
                            onChange={(e) => {
                              const updated = [...pollOptions];
                              updated[idx] = e.target.value;
                              setPollOptions(updated);
                            }}
                            className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-navy font-medium focus:border-brand focus:outline-none"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() =>
                                setPollOptions(pollOptions.filter((_, i) => i !== idx))
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



                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div>
                      <label className="block text-xs font-bold text-navy mb-1.5">Results Visibility</label>
                      <select
                        value={pollShowResults}
                        onChange={(e) => setPollShowResults(e.target.value as any)}
                        className="w-full h-9 rounded-xl border border-border bg-white px-3 text-xs text-navy font-semibold focus:border-brand focus:outline-none cursor-pointer shadow-2xs"
                      >
                        <option value="always">Always Visible</option>
                        <option value="after_vote">Show After User Votes</option>
                        <option value="after_close">Show When Poll Closes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-navy mb-1.5">
                        Poll Close Date (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={pollClosesAt}
                        onChange={(e) => setPollClosesAt(e.target.value)}
                        className="w-full h-9 rounded-xl border border-border bg-white px-3 text-xs text-navy font-semibold focus:border-brand focus:outline-none cursor-pointer shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <label className="block text-xs font-bold text-navy mb-1.5">
                      Anti-Fraud Protection
                    </label>
                    <div
                      onClick={() => setPollAllowAnonymous(!pollAllowAnonymous)}
                      className={`cursor-pointer p-2.5 rounded-xl border transition flex items-start gap-2.5 ${
                        pollAllowAnonymous
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-border bg-white"
                      }`}
                    >
                      <ShieldCheck
                        className={`h-4 w-4 mt-0.5 ${
                          pollAllowAnonymous ? "text-emerald-600" : "text-slate-400"
                        }`}
                      />
                      <div>
                        <p className="text-xs font-bold text-navy">IP &amp; Cookie Fingerprinting</p>
                        <p className="text-[10px] text-slate-500">
                          {pollAllowAnonymous
                            ? "Enabled — 1 vote per IP/browser"
                            : "Disabled — unlimited"}
                        </p>
                      </div>
                    </div>
                  </div>



                  <div className="pt-2 border-t border-border">
                    <label className="block text-xs font-bold text-navy mb-1.5">
                      Card Alignment &amp; Text Wrapping
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: "left", label: "Left (Wrap)", icon: AlignLeft },
                        { id: "center", label: "Center", icon: AlignCenter },
                        { id: "right", label: "Right (Wrap)", icon: AlignRight },
                        { id: "wide", label: "Full Width", icon: Maximize2 },
                      ].map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setPollAlign(l.id as any)}
                          className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            pollAlign === l.id
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

              {/* Poll Analytics Sub-Tab */}
              {pollTab === "analytics" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-navy flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-emerald-600" />
                        Created Polls &amp; Analytics
                      </h4>
                      <p className="text-[10px] text-text-tertiary">
                        Browse votes and engagement for all polls in this website project
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
                        const headers: Record<string, string> = {};
                        if (activeProjId) headers["X-OpenPost-Project"] = activeProjId;
                        setLoadingPolls(true);
                        fetch("/api/polls", { headers })
                          .then((r) => r.json())
                          .then((res) => {
                            if (Array.isArray(res.data)) setProjectPolls(res.data);
                          })
                          .catch(() => {})
                          .finally(() => setLoadingPolls(false));
                      }}
                      disabled={loadingPolls}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-bold text-navy hover:bg-slate-100 transition shadow-2xs"
                    >
                      <RefreshCw className={`h-3 w-3 ${loadingPolls ? "animate-spin text-brand" : ""}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {loadingPolls ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <RefreshCw className="h-5 w-5 animate-spin text-brand" />
                      <span className="text-xs">Loading polls...</span>
                    </div>
                  ) : projectPolls.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl border border-dashed border-border bg-slate-50">
                      <BarChart3 className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-navy">No Polls Created Yet</p>
                      <p className="text-[10px] text-text-tertiary mt-0.5">
                        Create a poll in the tab above to start collecting reader votes.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto [scrollbar-width:thin]">
                      {projectPolls.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-xl border border-border bg-slate-50/70 p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-navy line-clamp-1">
                              {p.question}
                            </h5>
                            <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0 ml-2">
                              {p.totalVotes || 0} votes
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {(p.options || []).map((opt: any, idx: number) => {
                              const pct = opt.percentage ?? (p.totalVotes > 0 ? Math.round((opt.votes / p.totalVotes) * 100) : 0);
                              return (
                                <div key={opt.id || idx} className="space-y-0.5">
                                  <div className="flex items-center justify-between text-[11px] text-slate-700">
                                    <span className="truncate">{opt.label}</span>
                                    <span className="font-mono text-slate-400 text-[10px]">
                                      {pct}% ({opt.votes ?? 0})
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-brand rounded-full transition-all duration-300"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. CALLOUT MODAL */}
          {type === "callout" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">Callout Tone &amp; Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "tip", label: "💡 Pro Tip", border: "border-amber-400 bg-amber-50 text-amber-900" },
                    { id: "info", label: "ℹ️ Information", border: "border-blue-400 bg-blue-50 text-blue-900" },
                    { id: "warning", label: "⚠️ Important", border: "border-amber-500 bg-amber-50 text-amber-950" },
                    { id: "success", label: "✅ Key Takeaway", border: "border-emerald-400 bg-emerald-50 text-emerald-950" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCalloutTone(t.id as any)}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                        calloutTone === t.id
                          ? `${t.border} ring-2 ring-brand/40 shadow-xs`
                          : "border-border bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">Callout Content</label>
                <textarea
                  rows={3}
                  value={calloutText}
                  placeholder="Enter the highlighted takeaway or callout note..."
                  onChange={(e) => setCalloutText(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy leading-relaxed focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none resize-none shadow-2xs"
                />
              </div>

              {/* Live Preview Box */}
              <div className="pt-2 border-t border-border">
                <span className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">
                  Live Preview:
                </span>
                <div
                  className={`p-4 rounded-xl border-l-4 text-xs font-medium leading-relaxed ${
                    calloutTone === "tip"
                      ? "border-amber-500 bg-amber-50 text-slate-800 border-t border-r border-b border-amber-200"
                      : calloutTone === "info"
                      ? "border-blue-500 bg-blue-50 text-slate-800 border-t border-r border-b border-blue-200"
                      : calloutTone === "warning"
                      ? "border-amber-600 bg-amber-50 text-slate-900 border-t border-r border-b border-amber-200"
                      : "border-emerald-500 bg-emerald-50 text-slate-800 border-t border-r border-b border-emerald-200"
                  }`}
                >
                  <p className="font-bold text-navy mb-1 flex items-center gap-1.5">
                    {calloutTone === "tip" && "💡 Pro Tip"}
                    {calloutTone === "info" && "ℹ️ Information"}
                    {calloutTone === "warning" && "⚠️ Important Notice"}
                    {calloutTone === "success" && "✅ Key Takeaway"}
                  </p>
                  <p className="text-slate-700">{calloutText || "Key takeaway or essential note for readers."}</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. TABLE MODAL */}
          {type === "table" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-navy mb-1">Rows</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value, 10) || 3)}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-navy mb-1">Columns</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value, 10) || 3)}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[11px] text-text-tertiary">
                Includes top sticky header row formatting automatically.
              </p>
            </div>
          )}

          {/* 5. VIDEO MODAL */}
          {(type === "video" || type === "youtube") && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-navy text-xs">
                    YouTube / Shorts / Vimeo URL *
                  </label>
                  {videoUrl && parseVideoUrl(videoUrl) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700">
                      <Check className="h-3 w-3" /> {parseVideoUrl(videoUrl)?.provider} Detected
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white pl-9 pr-3 py-2.5 text-xs text-navy font-mono focus:border-brand focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-text-tertiary mt-1">
                  Paste any standard YouTube link, Shorts, Vimeo, or direct video URL.
                </p>
              </div>

              {/* Title & Caption */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Video Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Next.js 16 Overview"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Caption / Credit</label>
                  <input
                    type="text"
                    placeholder="e.g. Video by Creator"
                    value={videoCaption}
                    onChange={(e) => setVideoCaption(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              {/* Aspect Ratio Format */}
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Aspect Ratio Format</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "16:9", label: "16:9 Wide", icon: Monitor },
                    { id: "4:3", label: "4:3 Classic", icon: Tv },
                    { id: "1:1", label: "1:1 Square", icon: Square },
                    { id: "9:16", label: "9:16 Shorts", icon: Smartphone },
                  ].map((ar) => {
                    const Icon = ar.icon;
                    const isSelected = videoAspectRatio === ar.id;
                    return (
                      <button
                        key={ar.id}
                        type="button"
                        onClick={() => setVideoAspectRatio(ar.id as any)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                          isSelected
                            ? "border-brand bg-brand/10 text-navy font-bold shadow-2xs"
                            : "border-border bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 mb-0.5" />
                        <span className="text-[10px]">{ar.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Alignment & Width */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Alignment</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: "left", label: "Left", icon: AlignLeft },
                      { id: "center", label: "Center", icon: AlignCenter },
                      { id: "right", label: "Right", icon: AlignRight },
                      { id: "wide", label: "Full", icon: Maximize2 },
                    ].map((a) => {
                      const Icon = a.icon;
                      const isSelected = videoAlign === a.id;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setVideoAlign(a.id as any)}
                          className={`flex items-center justify-center p-2 rounded-xl border text-xs transition ${
                            isSelected
                              ? "border-brand bg-brand/10 text-navy font-bold"
                              : "border-border bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Size Preset</label>
                  <div className="grid grid-cols-3 gap-1">
                    {["50%", "75%", "100%"].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setVideoWidth(w)}
                        className={`py-2 rounded-xl border text-xs font-bold transition ${
                          videoWidth === w
                            ? "border-brand bg-brand/10 text-navy font-bold"
                            : "border-border bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Time & Advanced Options */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy">Start Time (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 01:30 or 90s"
                    value={videoStartTime}
                    onChange={(e) => setVideoStartTime(e.target.value)}
                    className="w-32 rounded-lg border border-border bg-white px-2.5 py-1 text-xs text-navy font-mono focus:border-brand focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={videoControls}
                      onChange={(e) => setVideoControls(e.target.checked)}
                      className="rounded border-border text-brand focus:ring-brand"
                    />
                    Player Controls
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={videoMuted}
                      onChange={(e) => setVideoMuted(e.target.checked)}
                      className="rounded border-border text-brand focus:ring-brand"
                    />
                    Start Muted
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={videoAutoplay}
                      onChange={(e) => setVideoAutoplay(e.target.checked)}
                      className="rounded border-border text-brand focus:ring-brand"
                    />
                    Autoplay
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={videoPrivacy}
                      onChange={(e) => setVideoPrivacy(e.target.checked)}
                      className="rounded border-border text-brand focus:ring-brand"
                    />
                    Privacy Mode
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 6. BUTTON MODAL */}
          {type === "button" && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-navy mb-1">Button Label</label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Destination URL</label>
                <input
                  type="url"
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-navy focus:border-brand focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Button Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "primary", label: "Primary Brand" },
                    { id: "dark", label: "Navy Solid" },
                    { id: "outline", label: "Outline" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setButtonVariant(s.id as any)}
                      className={`py-2 rounded-xl border text-xs font-bold transition ${
                        buttonVariant === s.id
                          ? "border-brand bg-brand/10 text-navy"
                          : "border-border hover:bg-surface-dim"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 7. FAQ MODAL */}
          {type === "faq" && (
            <div className="space-y-3">
              <p className="text-[11px] text-text-tertiary">
                Creates accordion Q&amp;A pairs and structured Schema.org FAQPage data.
              </p>
              {faqItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-border bg-[#F9FAFB] space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-navy text-xs">Question {idx + 1}</span>
                    {faqItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFaqItems(faqItems.filter((_, i) => i !== idx))}
                        className="text-text-tertiary hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Enter question"
                    value={item.question}
                    onChange={(e) => {
                      const updated = [...faqItems];
                      updated[idx].question = e.target.value;
                      setFaqItems(updated);
                    }}
                    className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                  <textarea
                    rows={2}
                    placeholder="Enter answer"
                    value={item.answer}
                    onChange={(e) => {
                      const updated = [...faqItems];
                      updated[idx].answer = e.target.value;
                      setFaqItems(updated);
                    }}
                    className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFaqItems([...faqItems, { question: "", answer: "" }])}
                className="text-xs font-bold text-brand flex items-center gap-1 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add Another FAQ
              </button>
            </div>
          )}

          {/* 8. DOWNLOAD MODAL */}
          {type === "download" && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-navy mb-1">File Name</label>
                <input
                  type="text"
                  value={downloadName}
                  onChange={(e) => setDownloadName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-navy mb-1">Download URL</label>
                <input
                  type="url"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-navy focus:border-brand focus:outline-none font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-navy hover:bg-surface-raised transition"
          >
            Cancel
          </button>
          {type === "poll" && pollTab === "analytics" ? (
            <button
              type="button"
              onClick={() => setPollTab("create")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-5 py-2 text-xs font-bold text-white hover:bg-navy-light transition shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Create New Poll
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (type === "image") handleInsertImage();
                else if (type === "poll") handleInsertPoll();
                else if (type === "callout") handleInsertCallout();
                else if (type === "table") handleInsertTable();
                else if (type === "video" || type === "youtube") handleInsertVideo();
                else if (type === "button") handleInsertButton();
                else if (type === "faq") handleInsertFaq();
                else if (type === "download") handleInsertDownload();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-xs font-bold text-navy hover:bg-brand-hover hover:text-white transition shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              Insert Block
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
