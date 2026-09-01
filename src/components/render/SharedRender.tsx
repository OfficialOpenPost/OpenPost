"use client";

import * as React from "react";
import { useState } from "react";
import { Copy, Check, Download as DownloadIcon } from "lucide-react";

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

            const figureStyle: React.CSSProperties = {
              width: isLeft || isRight ? (width === "100%" ? "45%" : width || "45%") : isCenter ? (width || "100%") : isWide ? "100%" : (width || "280px"),
              maxWidth: isLeft || isRight ? "60%" : "100%",
              marginTop: `${marginTop}px`,
              marginRight: isCenter ? "auto" : isRight ? "0px" : `${marginRight}px`,
              marginBottom: `${marginBottom}px`,
              marginLeft: isCenter ? "auto" : isLeft ? "0px" : `${marginLeft}px`,
            };

            const imageElement = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={isDecorative ? "" : alt || ""}
                title={title || undefined}
                loading="lazy"
                className={`block w-full h-auto object-cover ${shadowMap[shadow] || "shadow-xs"} transition-all`}
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
            const toneCls: Record<string, string> = {
              info: "border-brand bg-brand/5",
              warning: "border-orange bg-orange/5",
              success: "border-green-500 bg-green-50",
              note: "border-navy bg-navy/5 text-navy",
              tip: "border-brand bg-brand/5",
            };
            return (
              <div
                key={i}
                className={`my-6 rounded-2xl border-l-4 p-5 shadow-2xs ${toneCls[tone] ?? toneCls.info}`}
              >
                {renderInline(node.content ?? [])}
              </div>
            );
          }
          case "poll":
          case "pollBlock": {
            return (
              <div key={i} className="my-6 rounded-2xl border border-border bg-white p-5 shadow-xs border-l-4 border-l-brand">
                <p className="font-bold text-navy text-sm mb-2">{node.attrs?.question ?? "Reader Poll"}</p>
                <div className="space-y-1.5">
                  {(node.attrs?.options ?? ["Option 1", "Option 2"]).map((opt: string, idx: number) => (
                    <div key={idx} className="rounded-xl border border-border bg-surface-raised px-3.5 py-2 text-xs font-semibold text-text-secondary flex justify-between">
                      <span>{opt}</span>
                      <span className="text-[10px] text-text-tertiary">Vote</span>
                    </div>
                  ))}
                </div>
              </div>
            );
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
            return (
              <div key={i} className="my-6 overflow-x-auto clear-both">
                <table className="w-full border-collapse rounded-2xl overflow-hidden border border-border shadow-xs">
                  <tbody>
                    {node.content?.map((row: any, r: number) => (
                      <tr key={r} className="border-b border-border last:border-0">
                        {row.content?.map((cell: any, c: number) => {
                          const Tag2 = cell.type === "tableHeader" ? "th" : "td";
                          return (
                            <Tag2
                              key={c}
                              className={
                                cell.type === "tableHeader"
                                  ? "bg-navy text-white p-3.5 text-left font-bold border-r border-white/10 last:border-0 text-xs"
                                  : "p-3.5 border-r border-border last:border-0 bg-surface text-xs"
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
