"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";

export type BlockModalType =
  | "image"
  | "poll"
  | "callout"
  | "table"
  | "faq"
  | "accordion"
  | "video"
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
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["Option 1", "Option 2"]);

  // Video State
  const [videoUrl, setVideoUrl] = useState("");

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
    if (!pollQuestion.trim()) return;
    const cleanOpts = pollOptions.filter((o) => o.trim().length > 0);
    if (cleanOpts.length < 2) {
      alert("Please provide at least 2 poll options");
      return;
    }

    const optionsHtml = cleanOpts
      .map(
        (opt) =>
          `<li style="margin: 4px 0; padding: 6px 12px; background: #F4F5F7; border-radius: 8px; font-size: 13px;">${opt}</li>`
      )
      .join("");

    const pollHtml = `
      <div data-type="poll-block" style="border: 1.5px solid #E2E8F0; border-radius: 16px; padding: 20px; background: #FFFFFF; margin: 24px 0; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
        <p style="font-weight: 800; font-size: 16px; color: #2D3440; margin-bottom: 12px;">📊 ${pollQuestion}</p>
        <ul style="list-style: none; padding: 0; margin: 0;">${optionsHtml}</ul>
        <p style="font-size: 11px; color: #94A3B8; margin-top: 10px;">Reader Poll · Interactive on live article</p>
      </div>
    `;

    editor.chain().focus().insertContent(pollHtml).run();
    onClose();
  };

  const handleInsertCallout = () => {
    const emojis = {
      tip: "💡",
      info: "ℹ️",
      warning: "⚠️",
      success: "✅",
    };
    const titles = {
      tip: "Pro Tip",
      info: "Note",
      warning: "Warning",
      success: "Success",
    };

    const calloutHtml = `
      <blockquote data-type="callout" data-tone="${calloutTone}" style="border-left: 4px solid #FEA611; background: #FEF9EE; padding: 16px 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 0; font-weight: 700; color: #2D3440; font-size: 14px;">${emojis[calloutTone]} ${titles[calloutTone]}</p>
        <p style="margin: 6px 0 0 0; color: #475569; font-size: 13px;">${calloutText}</p>
      </blockquote>
    `;

    editor.chain().focus().insertContent(calloutHtml).run();
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
    if (!videoUrl) return;
    let embedUrl = videoUrl;

    const ytMatch = videoUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    if (ytMatch && ytMatch[1]) {
      embedUrl = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
    }

    const videoHtml = `
      <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 16px; margin: 24px 0; background: #000;">
        <iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allowfullscreen></iframe>
      </div>
    `;

    editor.chain().focus().insertContent(videoHtml).run();
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
    editor.chain().focus().setFaq({ items: faqItems }).run();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-2xl animate-in zoom-in-95 text-navy">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/15 text-navy">
              {type === "image" && <ImageIcon className="h-4 w-4" />}
              {type === "poll" && <BarChart3 className="h-4 w-4" />}
              {type === "callout" && <Sparkles className="h-4 w-4" />}
              {type === "table" && <TableIcon className="h-4 w-4" />}
              {type === "video" && <Video className="h-4 w-4" />}
              {type === "button" && <ArrowUpRight className="h-4 w-4" />}
              {type === "faq" && <HelpCircle className="h-4 w-4" />}
              {type === "download" && <Download className="h-4 w-4" />}
            </span>
            <h3 className="text-sm font-extrabold text-navy capitalize">
              {type === "image" && "Insert Image Asset (Auto WebP)"}
              {type === "poll" && "Create Interactive Reader Poll"}
              {type === "callout" && "Insert Editorial Callout Box"}
              {type === "table" && "Insert Data Table"}
              {type === "video" && "Embed Video (YouTube / Vimeo)"}
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
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-navy mb-1">Poll Question *</label>
                <input
                  type="text"
                  placeholder="e.g. Which web framework do you prefer?"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Poll Options</label>
                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-text-tertiary w-4">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...pollOptions];
                          updated[idx] = e.target.value;
                          setPollOptions(updated);
                        }}
                        className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-navy focus:border-brand focus:outline-none"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setPollOptions(pollOptions.filter((_, i) => i !== idx))
                          }
                          className="text-text-tertiary hover:text-red-500 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`])
                  }
                  className="mt-2 text-xs font-bold text-brand flex items-center gap-1 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Option
                </button>
              </div>
            </div>
          )}

          {/* 3. CALLOUT MODAL */}
          {type === "callout" && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-navy mb-1">Callout Tone</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "tip", label: "💡 Tip" },
                    { id: "info", label: "ℹ️ Info" },
                    { id: "warning", label: "⚠️ Warning" },
                    { id: "success", label: "✅ Success" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCalloutTone(t.id as any)}
                      className={`py-2 rounded-xl border text-xs font-bold transition ${
                        calloutTone === t.id
                          ? "border-brand bg-brand/10 text-navy"
                          : "border-border hover:bg-surface-dim"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Callout Content</label>
                <textarea
                  rows={3}
                  value={calloutText}
                  onChange={(e) => setCalloutText(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                />
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
          {type === "video" && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-navy mb-1">
                  YouTube or Vimeo Video Link
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-navy focus:border-brand focus:outline-none font-mono"
                />
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
          <button
            type="button"
            onClick={() => {
              if (type === "image") handleInsertImage();
              else if (type === "poll") handleInsertPoll();
              else if (type === "callout") handleInsertCallout();
              else if (type === "table") handleInsertTable();
              else if (type === "video") handleInsertVideo();
              else if (type === "button") handleInsertButton();
              else if (type === "faq") handleInsertFaq();
              else if (type === "download") handleInsertDownload();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-xs font-bold text-navy hover:bg-brand-hover hover:text-white transition shadow-xs"
          >
            <Check className="h-3.5 w-3.5" />
            Insert Block
          </button>
        </div>
      </div>
    </div>
  );
}
