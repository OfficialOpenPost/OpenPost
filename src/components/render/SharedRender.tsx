"use client";

import * as React from "react";
import { useState } from "react";
import { Copy, Check, Download as DownloadIcon, BarChart2, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

interface SharedRenderProps {
  content: any;
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

function SharedPollCard({ node }: { node: any }) {
  const layout = node.attrs?.layout || node.attrs?.align || "center";
  const widthVal = node.attrs?.width || "100%";
  const desc = node.attrs?.description || "";
  const pollId = node.attrs?.pollId || node.attrs?.id;
  const rawList = Array.isArray(node.attrs?.options)
    ? node.attrs.options
    : Array.isArray(node.attrs?.items)
    ? node.attrs.items
    : ["Option 1", "Option 2"];

  const rawOptions = rawList.map((opt: any, idx: number) => ({
    id: typeof opt === "string" ? `opt_${idx + 1}` : opt?.id || `opt_${idx + 1}`,
    label: typeof opt === "string" ? opt : opt?.label || opt?.text || `Option ${idx + 1}`,
    votes: typeof opt === "object" ? opt?.votes ?? 0 : 0,
  }));

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState(rawOptions);
  const [totalVotes, setTotalVotes] = useState(
    rawOptions.reduce((acc: number, o: any) => acc + (o.votes || 0), 0)
  );

  // Sync when node attrs change dynamically
  React.useEffect(() => {
    const currentList = Array.isArray(node.attrs?.options)
      ? node.attrs.options
      : Array.isArray(node.attrs?.items)
      ? node.attrs.items
      : ["Option 1", "Option 2"];
    const mapped = currentList.map((opt: any, idx: number) => ({
      id: typeof opt === "string" ? `opt_${idx + 1}` : opt?.id || `opt_${idx + 1}`,
      label: typeof opt === "string" ? opt : opt?.label || opt?.text || `Option ${idx + 1}`,
      votes: typeof opt === "object" ? opt?.votes ?? 0 : 0,
    }));
    setOptions(mapped);
    setTotalVotes(mapped.reduce((acc: number, o: any) => acc + (o.votes || 0), 0));
  }, [JSON.stringify(node.attrs?.options), JSON.stringify(node.attrs?.items)]);

  // Sync with local storage or fetch live poll data if available
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storageKey = `op_voted_${pollId || "temp"}`;
      const savedChoice = localStorage.getItem(storageKey);
      if (savedChoice) {
        setHasVoted(true);
        setSelectedOption(savedChoice);
      }
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (pollId && typeof pollId === "string" && uuidRegex.test(pollId)) {
      fetch(`/api/v1/polls/${pollId}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.data && Array.isArray(res.data.options)) {
            setOptions(res.data.options);
            setTotalVotes(res.data.totalVotes ?? res.data.options.reduce((a: number, b: any) => a + (b.votes || 0), 0));
          }
        })
        .catch(() => {});
    }
  }, [pollId]);

  const alignCls =
    layout === "left"
      ? "float-left mr-6 mb-4 clear-none"
      : layout === "right"
      ? "float-right ml-6 mb-4 clear-none"
      : layout === "wide"
      ? "w-full my-6 clear-both"
      : "mx-auto my-6 clear-both";

  const handleVote = async () => {
    if (!selectedOption || loading || hasVoted) return;
    setLoading(true);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (pollId && typeof pollId === "string" && uuidRegex.test(pollId)) {
      try {
        await fetch(`/api/v1/polls/${pollId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionId: selectedOption }),
        });
      } catch {}
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(`op_voted_${pollId || "temp"}`, selectedOption);
    }

    setOptions((prev: any[]) =>
      prev.map((o) => (o.id === selectedOption ? { ...o, votes: (o.votes || 0) + 1 } : o))
    );
    setTotalVotes((prev: number) => prev + 1);
    setHasVoted(true);
    setLoading(false);
  };

  return (
    <div
      className={`rounded-none bg-white p-6 shadow-xs ${alignCls}`}
      style={{ width: widthVal, maxWidth: "100%", border: "2px solid #FEA611" }}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-none text-navy font-bold shadow-2xs"
            style={{ backgroundColor: "#FEA611" }}
          >
            <BarChart2 className="h-3.5 w-3.5 text-navy" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-navy">
            Interactive Poll
          </span>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-none px-2 py-0.5">
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
              className={`relative overflow-hidden rounded-none border px-3.5 py-2.5 transition cursor-pointer ${
                hasVoted
                  ? "border-slate-200 bg-white"
                  : isSelected
                  ? "border-slate-400 bg-white shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {hasVoted && (
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500 opacity-20"
                  style={{ width: `${percentage}%`, backgroundColor: "#FEA611" }}
                />
              )}

              <div className="relative flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  {!hasVoted && (
                    <div className="h-3.5 w-3.5 border flex items-center justify-center border-slate-300 bg-white rounded-none">
                      {isSelected && (
                        <div
                          className="h-1.5 w-1.5 rounded-none"
                          style={{ backgroundColor: "#FEA611" }}
                        />
                      )}
                    </div>
                  )}
                  <span className="text-xs sm:text-sm font-semibold text-navy">{opt.label}</span>
                </div>

                {hasVoted && (
                  <div className="flex items-center gap-2 text-xs font-bold text-navy">
                    <span>{percentage}%</span>
                    <span className="text-slate-400 font-mono text-[11px]">({opt.votes || 0})</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">{totalVotes} total votes</span>

        {!hasVoted ? (
          <button
            type="button"
            onClick={handleVote}
            disabled={!selectedOption || loading}
            className="inline-flex items-center gap-1.5 rounded-none px-4 py-1.5 text-xs font-bold text-navy transition disabled:opacity-50 shadow-xs hover:brightness-95"
            style={{ backgroundColor: "#FEA611" }}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Submit Vote
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Thank you for voting!
          </span>
        )}
      </div>
    </div>
  );
}

// Shared between CMS preview and public frontend — guarantees complete visual and layout parity
export function SharedRender({ content }: SharedRenderProps) {
  if (!content || !content.content) return <p className="text-sm text-text-tertiary">No content</p>;

  const faqNodes = content.content.filter((n: any) => n.type === "faq");
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
    <div className="prose prose-slate max-w-none text-navy leading-relaxed prose-headings:text-navy prose-a:text-brand prose-blockquote:border-brand prose-code:bg-navy prose-code:text-brand">
      {content.content.map((node: any, i: number) => {
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
              width = "100%",
              layout = "center",
              float = "none",
              marginTop = 8,
              marginRight = 24,
              marginBottom = 16,
              marginLeft = 24,
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
            const isCenter = !isLeft && !isRight && !isWide && !isInline;

            // Float container CSS
            let floatClass = "block my-8 clear-both";
            if (isLeft) floatClass = "float-none sm:float-left clear-none inline-block";
            if (isRight) floatClass = "float-none sm:float-right clear-none inline-block";
            if (isWide) floatClass = "block w-full my-8 clear-both";
            if (isInline) floatClass = "inline-block clear-none align-middle my-2";
            if (isCenter) floatClass = "block my-8 clear-both mx-auto text-center";

            const shadowMap: Record<string, string> = {
              none: "shadow-none",
              sm: "shadow-xs",
              md: "shadow-md",
              lg: "shadow-lg",
              xl: "shadow-2xl",
            };

            const parseRenderWidth = (w: any) => {
              if (typeof w === "number") return `${w}px`;
              if (typeof w === "string") return w;
              return "380px";
            };

            const figureStyle: React.CSSProperties = {
              width: isLeft || isRight
                ? (width === "100%" ? "42%" : parseRenderWidth(width))
                : isCenter
                ? (width === "100%" ? "100%" : parseRenderWidth(width))
                : isWide
                ? "100%"
                : parseRenderWidth(width),
              maxWidth: "100%",
              marginTop: `${marginTop ?? 6}px`,
              marginRight: isCenter ? "auto" : isRight ? "0px" : `${marginRight ?? 20}px`,
              marginBottom: `${marginBottom ?? 12}px`,
              marginLeft: isCenter ? "auto" : isLeft ? "0px" : `${marginLeft ?? 20}px`,
            };

            const imageElement = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={isDecorative ? "" : alt || ""}
                title={title || undefined}
                loading="lazy"
                className={`block w-full h-auto object-contain ${shadowMap[shadow] || "shadow-xs"} transition-all`}
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
              <figure key={i} className={`floating-image-render ${floatClass}`} style={figureStyle}>
                {link ? (
                  <a
                    href={link}
                    target={openLinkInNewTab ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {imageElement}
                  </a>
                ) : (
                  imageElement
                )}
                {caption && (
                  <figcaption
                    className={`mt-2 text-xs text-text-tertiary text-${captionAlign}`}
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
            return <SharedPollCard key={i} node={node} />;
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
          case "youtube":
          case "videoBlock":
          case "embedBlock": {
            const {
              src = "",
              url = "",
              videoId = "",
              provider = "youtube",
              caption = "",
              title = "",
              align = "center",
              layout = "center",
              width = "100%",
              aspectRatio = "16:9",
              startTime = 0,
              autoplay = false,
              muted = false,
              loop = false,
              controls = true,
              privacyEnhanced = true,
            } = node.attrs ?? {};

            const rawUrl = src || url || "";
            let embedSrc = rawUrl;
            let effVideoId = videoId;
            let effProvider = provider;

            const ytMatch = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
            if (ytMatch && ytMatch[1]) {
              effVideoId = ytMatch[1];
              effProvider = "youtube";
            }
            const vimeoMatch = rawUrl.match(/(?:vimeo\.com\/)(\d+)/);
            if (vimeoMatch && vimeoMatch[1]) {
              effVideoId = vimeoMatch[1];
              effProvider = "vimeo";
            }

            if (effProvider === "youtube" && effVideoId) {
              const base = privacyEnhanced !== false
                ? `https://www.youtube-nocookie.com/embed/${effVideoId}`
                : `https://www.youtube.com/embed/${effVideoId}`;
              const params = new URLSearchParams();
              if (autoplay) params.set("autoplay", "1");
              if (muted) params.set("mute", "1");
              if (loop) {
                params.set("loop", "1");
                params.set("playlist", effVideoId);
              }
              if (controls === false) params.set("controls", "0");
              if (startTime) params.set("start", String(startTime));
              params.set("rel", "0");
              const qs = params.toString();
              embedSrc = qs ? `${base}?${qs}` : base;
            } else if (effProvider === "vimeo" && effVideoId) {
              const base = `https://player.vimeo.com/video/${effVideoId}`;
              embedSrc = base;
            }

            const isLeft = align === "left" || layout === "left";
            const isRight = align === "right" || layout === "right";
            const isWide = align === "wide" || layout === "wide";

            let floatClass = "block my-8 clear-both mx-auto";
            if (isLeft) floatClass = "float-none sm:float-left mr-8 mb-6 clear-none max-w-[48%]";
            if (isRight) floatClass = "float-none sm:float-right ml-8 mb-6 clear-none max-w-[48%]";
            if (isWide) floatClass = "block w-full my-8 clear-both";

            const aspectClass =
              aspectRatio === "9:16"
                ? "aspect-[9/16] max-w-[360px] mx-auto"
                : aspectRatio === "1:1"
                ? "aspect-square max-w-[540px] mx-auto"
                : aspectRatio === "4:3"
                ? "aspect-[4/3]"
                : "aspect-video";

            return (
              <figure key={i} className={`overflow-hidden rounded-3xl border border-border bg-slate-950 shadow-md ${floatClass}`} style={{ width: isWide ? "100%" : width || "100%", maxWidth: "100%" }}>
                <div className={`relative w-full ${aspectClass}`}>
                  <iframe
                    src={embedSrc}
                    title={title || caption || "Embedded Video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                </div>
                {(caption || title) && (
                  <figcaption className="p-3 bg-white border-t border-slate-100 text-center">
                    {title && <p className="text-xs font-bold text-navy truncate">{title}</p>}
                    {caption && <p className="text-[11px] text-slate-500 italic mt-0.5">{caption}</p>}
                  </figcaption>
                )}
              </figure>
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
