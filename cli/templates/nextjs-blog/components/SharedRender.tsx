"use client";

import * as React from "react";
import { useState } from "react";
import { Copy, Check, Download as DownloadIcon, BarChart2, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

interface SharedRenderProps {
  content: any;
  viewport?: "desktop" | "tablet" | "mobile" | "wide";
  isMobile?: boolean;
}

function renderInline(content: any[]): React.ReactNode[] {
  if (!Array.isArray(content)) return [];
  return content.map((c: any, idx: number) => {
    if (c.type === "text") {
      let node: React.ReactNode = c.text ?? "";
      if (c.marks) {
        for (const m of c.marks) {
          if (m.type === "bold") node = <strong key={`${idx}-b`} className="font-bold text-navy">{node}</strong>;
          if (m.type === "italic") node = <em key={`${idx}-i`} className="italic">{node}</em>;
          if (m.type === "underline") node = <u key={`${idx}-u`}>{node}</u>;
          if (m.type === "strike") node = <s key={`${idx}-s`}>{node}</s>;
          if (m.type === "superscript") node = <sup key={`${idx}-sup`} className="text-xs">{node}</sup>;
          if (m.type === "subscript") node = <sub key={`${idx}-sub`} className="text-xs">{node}</sub>;
          if (m.type === "code") node = <code key={`${idx}-c`} className="rounded bg-[#2D3440] px-1 py-0.5 font-mono text-sm text-[#FEA611]">{node}</code>;
          if (m.type === "highlight") node = <mark key={`${idx}-h`} className="px-1 rounded" style={{ backgroundColor: m.attrs?.color || "rgba(254,166,17,0.28)" }}>{node}</mark>;
          if (m.type === "link") node = <a key={`${idx}-a`} href={m.attrs?.href ?? "#"} target={m.attrs?.target || "_blank"} rel="noopener noreferrer" className="text-[#FE4F01] underline decoration-[#FE4F01]/30 underline-offset-4 hover:decoration-[#FE4F01]">{node}</a>;
          if (m.type === "textStyle") {
            const style: React.CSSProperties = {};
            if (m.attrs?.color) style.color = m.attrs.color;
            if (m.attrs?.fontFamily) style.fontFamily = m.attrs.fontFamily;
            if (m.attrs?.fontSize) style.fontSize = m.attrs.fontSize;
            node = <span key={`${idx}-style`} style={style}>{node}</span>;
          }
        }
      }
      return <React.Fragment key={idx}>{node}</React.Fragment>;
    }
    if (c.type === "hardBreak") return <br key={idx} />;
    if (c.content) return <React.Fragment key={idx}>{renderInline(c.content)}</React.Fragment>;
    return <React.Fragment key={idx}>{c.text ?? ""}</React.Fragment>;
  });
}

function renderInlineText(content: any[]): string {
  if (!Array.isArray(content)) return "";
  return content.map((c: any) => c.text ?? (c.content ? renderInlineText(c.content) : "")).join("");
}

function getContrastTextColor(hexColor: string): string {
  if (!hexColor) return "#0F172A";
  const cleanHex = hexColor.replace("#", "");
  const fullHex = cleanHex.length === 3 ? cleanHex.split("").map((c) => c + c).join("") : cleanHex;
  const num = parseInt(fullHex, 16);
  if (isNaN(num)) return "#0F172A";
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? "#0F172A" : "#FFFFFF";
}

function SharedPollCard({ node, isMobileView }: { node: any; isMobileView?: boolean }) {
  const layout = node.attrs?.layout || node.attrs?.align || "center";
  const desc = node.attrs?.description || "";
  const pollId = node.attrs?.pollId || node.attrs?.id;
  const question = node.attrs?.question || "Reader Poll";

  // Storage key based on pollId or question text
  const pollKey = pollId || encodeURIComponent(question.slice(0, 40));
  const storageKey = "op_poll_voted_" + pollKey;
  const dataKey = "op_poll_data_" + pollKey;

  const rawList = Array.isArray(node.attrs?.options)
    ? node.attrs.options
    : Array.isArray(node.attrs?.items)
    ? node.attrs.items
    : ["Option 1", "Option 2"];

  const rawOptions = rawList.map((opt: any, idx: number) => ({
    id: typeof opt === "string" ? "opt_" + (idx + 1) : opt?.id || "opt_" + (idx + 1),
    label: typeof opt === "string" ? opt : opt?.label || opt?.text || "Option " + (idx + 1),
    votes: typeof opt === "object" ? opt?.votes ?? 0 : 0,
  }));

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState(rawOptions);
  const [totalVotes, setTotalVotes] = useState(
    rawOptions.reduce((acc: number, o: any) => acc + (o.votes || 0), 0)
  );

  // Sync with local storage or fetch live poll data if available
  React.useEffect(() => {
    let currentOptions = rawOptions;
    let currentTotal = rawOptions.reduce((acc: number, o: any) => acc + (o.votes || 0), 0);

    if (typeof window !== "undefined") {
      const savedChoice = localStorage.getItem(storageKey) || localStorage.getItem("op_voted_" + (pollId || "temp"));
      const savedData = localStorage.getItem(dataKey);

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (Array.isArray(parsed.options) && parsed.options.length > 0) {
            currentOptions = parsed.options;
            currentTotal = parsed.totalVotes ?? currentOptions.reduce((a: number, b: any) => a + (b.votes || 0), 0);
          }
        } catch {}
      }

      if (savedChoice) {
        setHasVoted(true);
        setSelectedOption(savedChoice);
        const choiceOpt = currentOptions.find((o: any) => o.id === savedChoice);
        if (currentTotal === 0 || (choiceOpt && (choiceOpt.votes || 0) === 0)) {
          currentOptions = currentOptions.map((o: any) =>
            o.id === savedChoice ? { ...o, votes: (o.votes || 0) + 1 } : o
          );
          currentTotal = currentOptions.reduce((a: number, b: any) => a + (b.votes || 0), 0);
        }
      }
    }

    setOptions(currentOptions);
    setTotalVotes(currentTotal);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (pollId && typeof pollId === "string" && uuidRegex.test(pollId)) {
      const baseUrl = (process.env.NEXT_PUBLIC_OPENPOST_URL || "").replace(/\/$/, "");
      fetch(baseUrl + "/api/v1/polls/" + pollId)
        .then((r) => r.json())
        .then((res) => {
          if (res.data && Array.isArray(res.data.options)) {
            const apiOptions = res.data.options;
            const apiTotal = res.data.totalVotes ?? apiOptions.reduce((a: number, b: any) => a + (b.votes || 0), 0);
            setOptions(apiOptions);
            setTotalVotes(apiTotal);
            if (typeof window !== "undefined") {
              localStorage.setItem(dataKey, JSON.stringify({ options: apiOptions, totalVotes: apiTotal }));
            }
          }
        })
        .catch(() => {});
    }
  }, [pollId, storageKey, dataKey]);

  const isLeft = layout === "left";
  const isRight = layout === "right";
  const isWide = layout === "wide";

  // Responsive alignment: in mobile view always 100% full width & centered; on tablet/desktop float left/right with scaled widths
  let alignCls = "openpost-poll-card w-full my-6 sm:my-8 clear-both mx-auto max-w-full sm:max-w-2xl";
  if (isMobileView) {
    alignCls = "openpost-poll-card w-full my-6 clear-both mx-auto block";
  } else if (isLeft) {
    alignCls = "openpost-poll-card block sm:inline-block sm:float-left clear-both sm:clear-none mx-auto sm:mx-0 ml-0 mr-0 sm:mr-6 md:mr-7 lg:mr-8 mb-4 sm:mb-6";
  } else if (isRight) {
    alignCls = "openpost-poll-card block sm:inline-block sm:float-right clear-both sm:clear-none mx-auto sm:mx-0 mr-0 ml-0 sm:ml-6 md:ml-7 lg:ml-8 mb-4 sm:mb-6";
  } else if (isWide) {
    alignCls = "openpost-poll-card w-full my-6 sm:my-8 clear-both";
  }

  const handleVote = async () => {
    if (!selectedOption || loading || hasVoted) return;
    setLoading(true);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (pollId && typeof pollId === "string" && uuidRegex.test(pollId)) {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_OPENPOST_URL || "").replace(/\/$/, "");
        await fetch(baseUrl + "/api/v1/polls/" + pollId + "/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionId: selectedOption }),
        });
      } catch {}
    }

    const updatedOptions = options.map((o: any) =>
      o.id === selectedOption ? { ...o, votes: (o.votes || 0) + 1 } : o
    );
    const updatedTotal = totalVotes + 1;

    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, selectedOption);
      localStorage.setItem("op_voted_" + (pollId || "temp"), selectedOption);
      localStorage.setItem(dataKey, JSON.stringify({ options: updatedOptions, totalVotes: updatedTotal }));
    }

    setOptions(updatedOptions);
    setTotalVotes(updatedTotal);
    setHasVoted(true);
    setLoading(false);
  };

  const themeColor = node.attrs?.themeColor || node.attrs?.color || "#FEA611";
  const textColor = getContrastTextColor(themeColor);
  const customWidth = node.attrs?.width;
  const defaultWidth = isLeft || isRight ? "45%" : "100%";
  const effectiveWidth = isMobileView ? "100%" : (customWidth || defaultWidth);

  return (
    <div
      data-poll-block="true"
      data-poll-align={layout}
      className={"rounded-none bg-white p-4 sm:p-6 shadow-xs max-w-full " + alignCls}
      style={{
        width: effectiveWidth,
        maxWidth: "100%",
        boxSizing: "border-box",
        border: `2px solid ${themeColor}`,
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: themeColor,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-none font-bold shadow-2xs shrink-0"
            style={{ backgroundColor: themeColor, color: textColor }}
          >
            <BarChart2 className="h-3.5 w-3.5" style={{ color: textColor }} />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-navy">
            Interactive Poll
          </span>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-none px-2 py-0.5 shrink-0">
          <ShieldCheck className="h-3 w-3 text-emerald-600" /> Fraud Protected
        </span>
      </div>

      <h3 className="text-sm sm:text-base font-bold text-navy leading-snug tracking-tight mb-2">
        {node.attrs?.question ?? "Reader Poll"}
      </h3>

      {desc && (
        <p className="text-xs text-slate-600 font-normal leading-relaxed mb-3.5 bg-slate-50 border border-slate-200/60 rounded-none p-3">
          {desc}
        </p>
      )}

      <div className="space-y-2.5 my-3">
        {options.map((opt: any) => {
          const percentage = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
          const isSelected = selectedOption === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => !hasVoted && setSelectedOption(opt.id)}
              className={"relative overflow-hidden rounded-none border px-3.5 py-3 transition cursor-pointer select-none " + (
                hasVoted
                  ? isSelected
                    ? "bg-slate-50/50 ring-1"
                    : "border-slate-200 bg-white"
                  : isSelected
                  ? "bg-slate-50/50 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              )}
              style={isSelected ? { borderColor: themeColor } : undefined}
            >
              {/* Animated Progress Bar */}
              {hasVoted && (
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-700 ease-out pointer-events-none"
                  style={{
                    width: percentage + "%",
                    backgroundColor: isSelected ? themeColor : "#CBD5E1",
                    opacity: isSelected ? 0.35 : 0.25,
                  }}
                />
              )}

              <div className="relative flex items-center justify-between z-10 gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                  {!hasVoted ? (
                    <div
                      className={"h-4 w-4 shrink-0 border flex items-center justify-center rounded-none transition " + (
                        isSelected ? "" : "border-slate-300 bg-white"
                      )}
                      style={isSelected ? { borderColor: themeColor, backgroundColor: themeColor } : undefined}
                    >
                      {isSelected && (
                        <div className="h-1.5 w-1.5" style={{ backgroundColor: textColor }} />
                      )}
                    </div>
                  ) : isSelected ? (
                    <div
                      className="h-4 w-4 shrink-0 flex items-center justify-center font-black text-[10px]"
                      style={{ backgroundColor: themeColor, color: textColor }}
                    >
                      <Check className="h-3 w-3 stroke-[3]" style={{ color: textColor }} />
                    </div>
                  ) : (
                    <div className="h-4 w-4 shrink-0 border border-slate-300 bg-slate-100" />
                  )}

                  <span className={"text-xs sm:text-sm truncate " + (
                    hasVoted && isSelected ? "font-bold text-navy" : "font-semibold text-navy"
                  )}>
                    {opt.label}
                  </span>

                  {hasVoted && isSelected && (
                    <span
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0 shadow-2xs"
                      style={{ backgroundColor: themeColor, color: textColor }}
                    >
                      Your Vote
                    </span>
                  )}
                </div>

                {hasVoted && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0 pl-1">
                    <span className="font-black text-navy text-xs sm:text-sm">{percentage}%</span>
                    <span className="text-slate-400 font-mono text-[10px] sm:text-[11px]">
                      ({opt.votes || 0})
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-500 font-medium">{totalVotes} {totalVotes === 1 ? "total vote" : "total votes"}</span>

        {!hasVoted ? (
          <button
            type="button"
            onClick={handleVote}
            disabled={!selectedOption || loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-none px-4 py-2 text-xs font-bold transition disabled:opacity-50 shadow-xs hover:brightness-95 active:scale-98 w-full sm:w-auto"
            style={{ backgroundColor: themeColor, color: textColor }}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" style={{ color: textColor }} /> : null}
            Submit Vote
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Thank you for voting!
          </span>
        )}
      </div>
    </div>
  );
}

// Shared between CMS preview and public frontend - guarantees complete visual and layout parity
export function SharedRender({ content, viewport, isMobile }: SharedRenderProps) {
  if (!content) return <p className="text-sm text-text-tertiary">No content</p>;

  const isMobileView = viewport === "mobile" || Boolean(isMobile);

  // If content is passed as JSON string, parse it
  let parsed = content;
  if (typeof content === "string") {
    try {
      parsed = JSON.parse(content);
    } catch {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }
  }

  if (!parsed || !parsed.content) {
    if (typeof parsed === "string") return <div dangerouslySetInnerHTML={{ __html: parsed }} />;
    return <p className="text-sm text-text-tertiary">No content</p>;
  }

  const faqNodes = parsed.content.filter((n: any) => n.type === "faq");
  const faqJsonLd = faqNodes.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqNodes.flatMap((n: any) => {
          const items = n.attrs?.items ?? (n.attrs?.question ? [{ question: n.attrs.question, answer: renderInlineText(n.content ?? []) }] : []);
          return items.map((it: any) => ({ "@type": "Question", name: it.question, acceptedAnswer: { "@type": "Answer", text: it.answer } }));
        }),
      }
    : null;

  return (
    <div className={`prose prose-slate max-w-none text-navy leading-relaxed prose-headings:text-navy prose-a:text-brand prose-blockquote:border-brand prose-code:bg-navy prose-code:text-brand ${isMobileView ? "preview-mobile" : ""}`} data-preview-viewport={viewport}>
      {parsed.content.map((node: any, i: number) => {
        switch (node.type) {
          case "paragraph": {
            const align = node.attrs?.textAlign;
            const alignCls = align === "center" ? "text-center" : align === "right" ? "text-right" : align === "justify" ? "text-justify" : "text-left";
            const lineHeight = node.attrs?.lineHeight;
            const style = lineHeight ? { lineHeight } : undefined;
            return <p key={i} className={`leading-7 my-3.5 ${alignCls}`} style={style}>{renderInline(node.content ?? [])}</p>;
          }
          case "heading": {
            const lvl = node.attrs?.level ?? 2;
            const align = node.attrs?.textAlign;
            const alignCls = align === "center" ? "text-center" : align === "right" ? "text-right" : align === "justify" ? "text-justify" : "text-left";
            const sizeCls =
              lvl === 1
                ? "text-[2.25rem] font-extrabold tracking-tight mt-8 mb-4"
                : lvl === 2
                ? "text-[1.75rem] font-bold tracking-tight mt-6 mb-3"
                : lvl === 3
                ? "text-[1.35rem] font-bold mt-5 mb-2.5"
                : "text-[1.15rem] font-semibold mt-4 mb-2";
            const kids = renderInline(node.content ?? []);
            if (lvl === 1) return <h1 key={i} className={`${sizeCls} ${alignCls}`}>{kids}</h1>;
            if (lvl === 3) return <h3 key={i} className={`${sizeCls} ${alignCls}`}>{kids}</h3>;
            if (lvl === 4) return <h4 key={i} className={`${sizeCls} ${alignCls}`}>{kids}</h4>;
            if (lvl === 5) return <h5 key={i} className={`${sizeCls} ${alignCls}`}>{kids}</h5>;
            if (lvl === 6) return <h6 key={i} className={`${sizeCls} ${alignCls}`}>{kids}</h6>;
            return <h2 key={i} className={`${sizeCls} ${alignCls}`}>{kids}</h2>;
          }
          case "image": {
            const {
              src = "",
              alt = "",
              title = "",
              caption = "",
              captionAlign = "center",
              layout = "center",
              float = "none",
              borderWidth = 0,
              borderStyle = "solid",
              borderColor = "#E2E8F0",
              borderRadius = 16,
              shadow = "sm",
              opacity = 1,
              rotation = 0,
              link = null,
              openLinkInNewTab = true,
              isDecorative = false,
            } = node.attrs ?? {};

            const isLeft = float === "left" || layout === "left";
            const isRight = float === "right" || layout === "right";
            const isWide = layout === "wide";
            const isInline = layout === "inline";

            // Float container CSS: In mobile preview ALWAYS centered block (full width); on tablet/desktop float left/right with matched proportions
            let floatClass = "w-full my-6 sm:my-8 clear-both mx-auto text-center flex flex-col items-center max-w-full sm:max-w-2xl";
            if (isMobileView) {
              floatClass = "w-full my-6 clear-both mx-auto text-center flex flex-col items-center block";
            } else if (isLeft) {
              floatClass = "w-full sm:w-[45%] md:w-[45%] lg:w-[48%] sm:max-w-[360px] lg:max-w-none block sm:inline-block sm:float-left clear-both sm:clear-none mx-auto sm:mx-0 ml-0 mr-0 sm:mr-6 md:mr-7 lg:mr-8 mb-4 sm:mb-6 text-center sm:text-left flex flex-col items-center sm:items-start";
            } else if (isRight) {
              floatClass = "w-full sm:w-[45%] md:w-[45%] lg:w-[48%] sm:max-w-[360px] lg:max-w-none block sm:inline-block sm:float-right clear-both sm:clear-none mx-auto sm:mx-0 mr-0 ml-0 sm:ml-6 md:ml-7 lg:ml-8 mb-4 sm:mb-6 text-center sm:text-right flex flex-col items-center sm:items-end";
            } else if (isWide) {
              floatClass = "w-full my-6 sm:my-8 clear-both mx-auto text-center flex flex-col items-center";
            } else if (isInline) {
              floatClass = "w-full sm:w-auto block sm:inline-block clear-both sm:clear-none align-middle my-4 sm:my-2 mx-auto sm:mx-2 text-center";
            }

            const effectiveCaptionAlign = isMobileView
              ? "text-center"
              : isLeft
              ? "text-left"
              : isRight
              ? "text-right"
              : `text-center sm:text-${captionAlign}`;

            const shadowMap: Record<string, string> = {
              none: "shadow-none",
              sm: "shadow-xs",
              md: "shadow-md",
              lg: "shadow-lg",
              xl: "shadow-2xl",
            };

            const imageElement = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={isDecorative ? "" : alt || ""}
                title={title || undefined}
                loading="lazy"
                className={`block max-w-full w-full h-auto object-contain ${
                  isLeft ? "mr-auto ml-0" : isRight ? "ml-auto mr-0" : "mx-auto"
                } ${shadowMap[shadow] || "shadow-xs"} transition-all`}
                style={{
                  borderRadius: `${borderRadius}px`,
                  borderWidth: borderWidth ? `${borderWidth}px` : undefined,
                  borderStyle: borderWidth ? borderStyle : undefined,
                  borderColor: borderWidth ? borderColor : undefined,
                  opacity: opacity !== 1 ? opacity : undefined,
                  transform: rotation ? `rotate(${rotation}deg)` : undefined,
                }}
              />
            );

            return (
              <figure key={i} className={`floating-image-render max-w-full ${floatClass}`} data-float={float} data-layout={layout}>
                {link ? (
                  <a
                    href={link}
                    target={openLinkInNewTab ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={`block w-full ${isLeft ? "mr-auto ml-0" : isRight ? "ml-auto mr-0" : "mx-auto"} max-w-full`}
                  >
                    {imageElement}
                  </a>
                ) : (
                  imageElement
                )}
                {caption && (
                  <figcaption
                    className={`mt-2 text-xs text-text-tertiary max-w-full mx-auto ${effectiveCaptionAlign}`}
                  >
                    {caption}
                  </figcaption>
                )}
              </figure>
            );
          }
          case "callout": {
            const tone = node.attrs?.tone ?? "info";
            const toneConfig: Record<string, { cls: string; label: string; icon: string }> = {
              tip: {
                cls: "border-l-4 border-amber-500 bg-amber-50/80 text-slate-800 border-slate-200/70",
                label: "Pro Tip",
                icon: "💡",
              },
              info: {
                cls: "border-l-4 border-blue-500 bg-blue-50/80 text-slate-800 border-slate-200/70",
                label: "Information",
                icon: "ℹ️",
              },
              warning: {
                cls: "border-l-4 border-amber-600 bg-amber-50/90 text-amber-950 border-amber-200/70",
                label: "Important Notice",
                icon: "⚠️",
              },
              success: {
                cls: "border-l-4 border-emerald-500 bg-emerald-50/80 text-slate-800 border-emerald-200/70",
                label: "Key Takeaway",
                icon: "✅",
              },
              note: {
                cls: "border-l-4 border-slate-700 bg-slate-100 text-slate-800 border-slate-200/70",
                label: "Note",
                icon: "📌",
              },
            };
            const cur = toneConfig[tone] || toneConfig.info;
            return (
              <div
                key={i}
                className={`my-6 rounded-2xl border p-5 sm:p-6 shadow-2xs ${cur.cls}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{cur.icon}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-navy">
                    {cur.label}
                  </span>
                </div>
                <div className="text-sm sm:text-base leading-relaxed text-slate-800 font-medium">
                  {renderInline(node.content ?? [])}
                </div>
              </div>
            );
          }
          case "poll":
          case "pollBlock": {
            return <SharedPollCard key={i} node={node} isMobileView={isMobileView} />;
          }
          case "gallery": {
            const images = node.attrs?.images ?? node.attrs?.items ?? [];
            if (images.length < 2) return <img key={i} src={images[0]?.src} alt="" className="rounded-2xl my-6" loading="lazy" />;
            const layout = node.attrs?.layout ?? "grid";
            return (
              <div key={i} className={layout === "carousel" ? "my-6 flex gap-4 overflow-x-auto snap-x pb-2" : "my-6 grid grid-cols-2 gap-4"}>
                {images.map((img: any, idx: number) => (
                  <img key={idx} src={img.src} alt={img.alt ?? ""} className="rounded-2xl w-full object-cover snap-center" loading="lazy" />
                ))}
              </div>
            );
          }
          case "faq": {
            const items = node.attrs?.items ?? (node.attrs?.question ? [{ question: node.attrs.question, answer: renderInlineText(node.content ?? []) || "Answer" }] : []);
            return (
              <div key={i} className="my-6 rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
                <div className="bg-navy px-4 py-3 text-sm font-bold text-white">Frequently Asked Questions</div>
                {items.map((it: any, idx: number) => (
                  <details key={idx} className="border-t border-border first:border-0 group" open={idx === 0}>
                    <summary className="cursor-pointer list-none px-4 py-3.5 font-semibold text-navy flex justify-between items-center hover:bg-surface-raised">
                      {it.question} <span className="text-brand group-open:rotate-180 transition font-bold">⌄</span>
                    </summary>
                    <div className="px-4 pb-4 text-xs leading-relaxed text-text-secondary">{it.answer}</div>
                  </details>
                ))}
              </div>
            );
          }
          case "accordion": {
            const items = node.attrs?.items ?? [];
            return (
              <div key={i} className="my-6 rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border shadow-xs">
                {items.map((it: any, idx: number) => (
                  <details key={idx} className="group" open={idx === 0}>
                    <summary className="cursor-pointer list-none px-4 py-3.5 font-semibold text-navy flex justify-between items-center hover:bg-surface-raised">
                      {it.title} <span className="text-brand group-open:rotate-180 transition font-bold">⌄</span>
                    </summary>
                    <div className="px-4 pb-4 text-xs leading-relaxed text-text-secondary">{it.content}</div>
                  </details>
                ))}
              </div>
            );
          }
          case "buttonBlock": {
            const variant = node.attrs?.variant ?? "primary";
            const cls = variant === "primary" ? "bg-brand text-navy shadow-xs hover:bg-brand-hover" : variant === "secondary" ? "bg-navy text-white hover:bg-navy-light" : "border border-navy text-navy hover:bg-surface-raised";
            return (
              <div key={i} className="my-6 text-center">
                <a href={node.attrs?.url ?? "#"} className={`inline-flex rounded-xl px-6 py-3 text-sm font-bold transition ${cls}`}>
                  {node.attrs?.label ?? "Learn More"}
                </a>
              </div>
            );
          }
          case "downloadBlock": {
            return (
              <div key={i} className="my-6 flex items-center gap-4 rounded-2xl border border-border bg-surface-raised p-4 shadow-2xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <DownloadIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-navy">{node.attrs?.fileName ?? "Document.pdf"}</div>
                  <div className="text-xs text-text-tertiary">{node.attrs?.fileSize ?? "Download File"}</div>
                </div>
                <a href={node.attrs?.url ?? "#"} className="ml-auto rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-navy-light transition">
                  Download
                </a>
              </div>
            );
          }
          case "youtube":
          case "videoBlock": {
            return node.attrs?.src ? (
              <div key={i} className="my-6 overflow-hidden rounded-2xl border border-border shadow-xs aspect-video">
                {node.attrs.src.includes("youtube.com") || node.attrs.src.includes("youtu.be") ? (
                  <iframe src={node.attrs.src} className="h-full w-full" allowFullScreen title="Video player" />
                ) : (
                  <video src={node.attrs.src} poster={node.attrs.poster} controls className="w-full h-full object-cover" />
                )}
              </div>
            ) : null;
          }
          case "embedBlock": {
            const { provider, videoId, url } = node.attrs ?? {};
            if (provider === "youtube" && videoId) {
              return (
                <div key={i} className="my-6 overflow-hidden rounded-2xl border border-border aspect-video shadow-xs">
                  <iframe src={`https://www.youtube.com/embed/${videoId}`} className="h-full w-full" allowFullScreen title="YouTube" />
                </div>
              );
            }
            if (provider === "vimeo" && videoId) {
              return (
                <div key={i} className="my-6 overflow-hidden rounded-2xl border border-border aspect-video shadow-xs">
                  <iframe src={`https://player.vimeo.com/video/${videoId}`} className="h-full w-full" allowFullScreen title="Vimeo" />
                </div>
              );
            }
            return (
              <div key={i} className="my-6 rounded-2xl border border-border bg-surface p-6 text-center text-sm text-text-tertiary">
                Embed: <a href={url ?? "#"} target="_blank" rel="noopener noreferrer" className="text-brand underline">{url ?? "View external content"}</a>
              </div>
            );
          }
          case "codeBlock": {
            const code = renderInlineText(node.content ?? []) || node.content?.map((c: any) => c.text).join("\n") || "";
            return <CodeBlock key={i} code={code} language={node.attrs?.language} />;
          }
          case "blockquote": {
            return (
              <blockquote key={i} className="my-6 border-l-4 border-brand bg-brand/5 pl-6 py-4 italic text-text-secondary rounded-r-2xl">
                {renderInline(node.content ?? [])}
              </blockquote>
            );
          }
          case "horizontalRule": {
            return <hr key={i} className="my-8 border-border" />;
          }
          case "bulletList": {
            return (
              <ul key={i} className="list-disc pl-6 my-4 space-y-2 marker:text-brand">
                {node.content?.map((li: any, idx: number) => (
                  <li key={idx}>{renderInline(li.content?.[0]?.content ?? li.content ?? [])}</li>
                ))}
              </ul>
            );
          }
          case "orderedList": {
            return (
              <ol key={i} className="list-decimal pl-6 my-4 space-y-2 marker:text-brand marker:font-bold">
                {node.content?.map((li: any, idx: number) => (
                  <li key={idx}>{renderInline(li.content?.[0]?.content ?? li.content ?? [])}</li>
                ))}
              </ol>
            );
          }
          case "table": {
            const firstRow = node.content?.[0];
            const colwidths = firstRow?.content?.map((cell: any) => cell.attrs?.colwidth?.[0] || null) || [];
            const hasExplicitWidths = colwidths.some((w: any) => w !== null);

            return (
              <div key={i} className="my-6 overflow-x-auto clear-both">
                <table className="w-full border-collapse" style={{ tableLayout: "auto" }}>
                  {hasExplicitWidths && (
                    <colgroup>
                      {colwidths.map((w: any, idx: number) => (
                        <col key={idx} style={w ? { width: `${w}px` } : undefined} />
                      ))}
                    </colgroup>
                  )}
                  <tbody>
                    {node.content?.map((row: any, r: number) => (
                      <tr key={r} className="border-b border-slate-200 last:border-0">
                        {row.content?.map((cell: any, c: number) => {
                          const Tag2 = cell.type === "tableHeader" ? "th" : "td";
                          const cellStyle: React.CSSProperties = {};
                          if (cell.attrs?.style) {
                            const styles = String(cell.attrs.style).split(";");
                            for (const s of styles) {
                              const [k, v] = s.split(":").map((x: string) => x.trim());
                              if (k === "background-color") cellStyle.backgroundColor = v;
                              if (k === "vertical-align") cellStyle.verticalAlign = v;
                            }
                          }
                          return (
                            <Tag2
                              key={c}
                              colSpan={cell.attrs?.colspan || 1}
                              rowSpan={cell.attrs?.rowspan || 1}
                              style={{ ...cellStyle, padding: "0.75rem 1rem", verticalAlign: "top", lineHeight: "1.5", minHeight: "3rem" }}
                              className={
                                cell.type === "tableHeader"
                                  ? "bg-navy text-white text-left font-bold border-r border-white/10 last:border-0 text-[0.9375rem]"
                                  : "border-r border-slate-200 last:border-0 bg-slate-50 text-[0.9375rem] text-slate-700"
                              }
                            >
                              {renderInline(cell.content?.[0]?.content ?? cell.content ?? [])}
                            </Tag2>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          case "taskList": {
            return (
              <ul key={i} className="my-4 space-y-2 list-none">
                {node.content?.map((li: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={li.attrs?.checked}
                      readOnly
                      className="mt-1 rounded border-border text-brand focus:ring-brand"
                    />
                    <span>{renderInline(li.content?.[0]?.content ?? [])}</span>
                  </li>
                ))}
              </ul>
            );
          }
          default:
            return <div key={i} className="my-4 text-xs text-text-tertiary">[{node.type} block]</div>;
        }
      })}
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-navy bg-navy shadow-sm clear-both">
      <div className="flex items-center justify-between bg-navy px-4 py-2 text-xs text-slate-400 border-b border-white/10">
        <span className="font-mono">{language ?? "code"}</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1 font-semibold text-white hover:bg-white/20 transition"
        >
          {copied ? <Check className="h-3 w-3 text-brand" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-100 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
