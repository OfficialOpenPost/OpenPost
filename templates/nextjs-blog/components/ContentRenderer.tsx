"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Download as DownloadIcon,
  Info,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  ExternalLink,
} from "lucide-react";
import { PollWidget } from "./PollWidget";

interface ContentRendererProps {
  content: any;
  polls?: any[];
}

export function ContentRenderer({ content, polls }: ContentRendererProps) {
  if (!content) return null;

  // Handle stringified JSON
  let parsedContent = content;
  if (typeof content === "string") {
    try {
      parsedContent = JSON.parse(content);
    } catch {
      return <div className="prose-editorial" dangerouslySetInnerHTML={{ __html: content }} />;
    }
  }

  // Handle standard HTML string
  if (typeof parsedContent === "string") {
    return <div className="prose-editorial" dangerouslySetInnerHTML={{ __html: parsedContent }} />;
  }

  // Handle Tiptap JSON Doc
  if (parsedContent.type === "doc" && Array.isArray(parsedContent.content)) {
    const faqNodes = parsedContent.content.filter((n: any) => n.type === "faq");
    const faqJsonLd = faqNodes.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqNodes.flatMap((n: any) => {
            const items =
              n.attrs?.items ??
              (n.attrs?.question
                ? [{ question: n.attrs.question, answer: renderInlineText(n.content ?? []) }]
                : []);
            return items.map((it: any) => ({
              "@type": "Question",
              name: it.question,
              acceptedAnswer: { "@type": "Answer", text: it.answer },
            }));
          }),
        }
      : null;

    return (
      <div className="prose-editorial space-y-5">
        {parsedContent.content.map((node: any, idx: number) => (
          <RenderNode key={idx} node={node} polls={polls} />
        ))}
        {faqJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
        )}
      </div>
    );
  }

  return null;
}

function renderInlineText(content: any[]): string {
  if (!Array.isArray(content)) return "";
  return content
    .map((c: any) => c.text ?? (c.content ? renderInlineText(c.content) : ""))
    .join("");
}

function RenderInline({ content }: { content?: any[] }) {
  if (!Array.isArray(content)) return null;

  return (
    <>
      {content.map((item: any, idx: number) => {
        if (item.type === "text") {
          let node: React.ReactNode = item.text ?? "";
          if (item.marks) {
            for (const m of item.marks) {
              if (m.type === "bold") {
                node = <strong key={`${idx}-b`} className="font-bold text-navy">{node}</strong>;
              } else if (m.type === "italic") {
                node = <em key={`${idx}-i`} className="italic">{node}</em>;
              } else if (m.type === "underline") {
                node = <u key={`${idx}-u`}>{node}</u>;
              } else if (m.type === "strike") {
                node = <s key={`${idx}-s`}>{node}</s>;
              } else if (m.type === "superscript") {
                node = <sup key={`${idx}-sup`} className="text-xs">{node}</sup>;
              } else if (m.type === "subscript") {
                node = <sub key={`${idx}-sub`} className="text-xs">{node}</sub>;
              } else if (m.type === "code") {
                node = (
                  <code
                    key={`${idx}-c`}
                    className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-navy border border-slate-200"
                  >
                    {node}
                  </code>
                );
              } else if (m.type === "highlight") {
                node = (
                  <mark
                    key={`${idx}-h`}
                    className="px-1 rounded"
                    style={{ backgroundColor: m.attrs?.color || "rgba(254,166,17,0.28)" }}
                  >
                    {node}
                  </mark>
                );
              } else if (m.type === "link") {
                node = (
                  <a
                    key={`${idx}-a`}
                    href={m.attrs?.href ?? "#"}
                    target={m.attrs?.target || "_blank"}
                    rel="noopener noreferrer"
                    className="text-flame underline decoration-flame/30 underline-offset-4 hover:decoration-flame font-medium"
                  >
                    {node}
                  </a>
                );
              } else if (m.type === "textStyle") {
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
        if (item.type === "hardBreak") return <br key={idx} />;
        if (item.content) return <RenderInline key={idx} content={item.content} />;
        return <React.Fragment key={idx}>{item.text ?? ""}</React.Fragment>;
      })}
    </>
  );
}

function RenderNode({ node, polls }: { node: any; polls?: any[] }) {
  if (!node) return null;

  switch (node.type) {
    case "paragraph": {
      const align = node.attrs?.textAlign;
      const alignCls =
        align === "center"
          ? "text-center"
          : align === "right"
          ? "text-right"
          : align === "justify"
          ? "text-justify"
          : "text-left";
      const lineHeight = node.attrs?.lineHeight;
      const style = lineHeight ? { lineHeight } : undefined;
      return (
        <p className={`my-4 leading-relaxed text-slate-700 text-base sm:text-lg ${alignCls}`} style={style}>
          <RenderInline content={node.content} />
        </p>
      );
    }

    case "heading": {
      const level = node.attrs?.level || 2;
      const align = node.attrs?.textAlign;
      const alignCls =
        align === "center"
          ? "text-center"
          : align === "right"
          ? "text-right"
          : align === "justify"
          ? "text-justify"
          : "text-left";
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      const headingClasses: Record<number, string> = {
        1: "text-3xl sm:text-4xl font-extrabold text-navy mt-10 mb-4 tracking-tight leading-tight",
        2: "text-2xl sm:text-3xl font-bold text-navy mt-8 mb-3 tracking-tight",
        3: "text-xl sm:text-2xl font-bold text-navy mt-6 mb-2.5",
        4: "text-lg font-bold text-navy mt-5 mb-2",
        5: "text-base font-semibold text-navy mt-4 mb-2",
        6: "text-sm font-semibold uppercase tracking-wider text-slate-500 mt-4 mb-2",
      };

      return (
        <Tag className={`${headingClasses[level] || headingClasses[2]} ${alignCls}`}>
          <RenderInline content={node.content} />
        </Tag>
      );
    }

    case "blockquote":
      return (
        <blockquote className="my-6 border-l-4 border-brand bg-brand/5 px-6 py-4 rounded-r-2xl italic text-slate-700 text-base sm:text-lg">
          <RenderInline content={node.content} />
        </blockquote>
      );

    case "codeBlock": {
      const code =
        renderInlineText(node.content ?? []) ||
        node.content?.map((c: any) => c.text).join("\n") ||
        "";
      return <CodeBlock code={code} language={node.attrs?.language} />;
    }

    case "bulletList":
      return (
        <ul className="list-disc pl-6 my-5 space-y-2 text-slate-700 marker:text-brand">
          {node.content?.map((item: any, i: number) => (
            <li key={i} className="leading-relaxed">
              <RenderInline content={item.content?.[0]?.content ?? item.content} />
            </li>
          ))}
        </ul>
      );

    case "orderedList":
      return (
        <ol className="list-decimal pl-6 my-5 space-y-2 text-slate-700 marker:text-brand marker:font-bold">
          {node.content?.map((item: any, i: number) => (
            <li key={i} className="leading-relaxed">
              <RenderInline content={item.content?.[0]?.content ?? item.content} />
            </li>
          ))}
        </ol>
      );

    case "taskList":
      return (
        <ul className="my-4 space-y-2.5 list-none pl-0">
          {node.content?.map((li: any, idx: number) => (
            <li key={idx} className="flex items-start gap-3 text-slate-700">
              <input
                type="checkbox"
                checked={li.attrs?.checked}
                readOnly
                className="mt-1.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
              />
              <span>
                <RenderInline content={li.content?.[0]?.content ?? li.content} />
              </span>
            </li>
          ))}
        </ul>
      );

    case "image": {
      const {
        src = "",
        alt = "Article image",
        title = "",
        caption = "",
        captionAlign = "center",
        width = "100%",
        layout = "center",
        float = "none",
        marginTop = 8,
        marginRight = 20,
        marginBottom = 16,
        marginLeft = 20,
        borderWidth = 0,
        borderStyle = "solid",
        borderColor = "#E2E8F0",
        borderRadius = 16,
        shadow = "sm",
        opacity = 1,
        rotation = 0,
        link = null,
        openLinkInNewTab = true,
      } = node.attrs ?? {};

      if (!src) return null;

      const isLeft = float === "left" || layout === "left";
      const isRight = float === "right" || layout === "right";
      const isWide = layout === "wide";
      const isInline = layout === "inline";
      const isCenter = !isLeft && !isRight && !isWide && !isInline;

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
        return "100%";
      };

      const figureStyle: React.CSSProperties = {
        width: isLeft || isRight
          ? (width === "100%" ? "45%" : parseRenderWidth(width))
          : isCenter
          ? (width === "100%" ? "100%" : parseRenderWidth(width))
          : isWide
          ? "100%"
          : parseRenderWidth(width),
        maxWidth: "100%",
        marginTop: `${marginTop ?? 6}px`,
        marginRight: isCenter ? "auto" : isRight ? "0px" : `${marginRight ?? 20}px`,
        marginBottom: `${marginBottom ?? 14}px`,
        marginLeft: isCenter ? "auto" : isLeft ? "0px" : `${marginLeft ?? 20}px`,
      };

      const imgTag = (
        <img
          src={src}
          alt={alt}
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
        <figure className={`openpost-floating-image ${floatClass}`} style={figureStyle}>
          {link ? (
            <a
              href={link}
              target={openLinkInNewTab ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="block"
            >
              {imgTag}
            </a>
          ) : (
            imgTag
          )}
          {caption && (
            <figcaption className={`mt-2 text-xs text-slate-500 text-${captionAlign}`}>
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "table": {
      const firstRow = node.content?.[0];
      const colwidths = firstRow?.content?.map((cell: any) => cell.attrs?.colwidth?.[0] || null) || [];
      const hasExplicitWidths = colwidths.some((w: any) => w !== null);

      return (
        <div className="my-6 overflow-x-auto clear-both">
          <table className="openpost-table w-full border-collapse" style={{ tableLayout: "auto" }}>
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
                        <RenderInline content={cell.content?.[0]?.content ?? cell.content} />
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

    case "callout": {
      const tone = node.attrs?.tone ?? "info";
      const configMap: Record<string, { bg: string; border: string; text: string; icon: any }> = {
        info: { bg: "bg-blue-50/70", border: "border-blue-500", text: "text-blue-900", icon: Info },
        warning: { bg: "bg-amber-50/80", border: "border-amber-500", text: "text-amber-950", icon: AlertTriangle },
        success: { bg: "bg-emerald-50/70", border: "border-emerald-500", text: "text-emerald-950", icon: CheckCircle2 },
        note: { bg: "bg-slate-100", border: "border-slate-600", text: "text-slate-900", icon: HelpCircle },
        tip: { bg: "bg-brand/10", border: "border-brand", text: "text-navy", icon: Lightbulb },
      };
      const cur = configMap[tone] || configMap.info;
      const IconComp = cur.icon;

      return (
        <div
          className={`my-6 flex gap-3.5 rounded-2xl border-l-4 p-5 shadow-2xs ${cur.bg} ${cur.border} ${cur.text}`}
        >
          <IconComp className="h-5 w-5 shrink-0 mt-0.5 opacity-90" />
          <div className="flex-1 text-sm sm:text-base leading-relaxed">
            <RenderInline content={node.content} />
          </div>
        </div>
      );
    }

    case "faq": {
      const items =
        node.attrs?.items ??
        (node.attrs?.question
          ? [{ question: node.attrs.question, answer: renderInlineText(node.content ?? []) || "Answer" }]
          : []);

      return (
        <div className="my-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs divide-y divide-slate-200">
          <div className="bg-navy px-5 py-3.5 text-sm font-bold text-white tracking-wide">
            Frequently Asked Questions
          </div>
          {items.map((it: any, idx: number) => (
            <details key={idx} className="group p-5" open={idx === 0}>
              <summary className="cursor-pointer list-none font-bold text-navy flex justify-between items-center text-sm sm:text-base hover:text-brand transition">
                <span>{it.question}</span>
                <span className="text-brand text-lg font-bold group-open:rotate-180 transition-transform">
                  ⌄
                </span>
              </summary>
              <div className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600">
                {it.answer}
              </div>
            </details>
          ))}
        </div>
      );
    }

    case "accordion": {
      const items = node.attrs?.items ?? [];
      return (
        <div className="my-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs divide-y divide-slate-200">
          {items.map((it: any, idx: number) => (
            <details key={idx} className="group p-5" open={idx === 0}>
              <summary className="cursor-pointer list-none font-bold text-navy flex justify-between items-center text-sm sm:text-base hover:text-brand transition">
                <span>{it.title}</span>
                <span className="text-brand text-lg font-bold group-open:rotate-180 transition-transform">
                  ⌄
                </span>
              </summary>
              <div className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600">
                {it.content}
              </div>
            </details>
          ))}
        </div>
      );
    }

    case "poll":
    case "pollBlock": {
      const pollId = node.attrs?.pollId || node.attrs?.id;
      const matchedPoll = polls?.find((p) => p.id === pollId);
      if (!matchedPoll) return null;
      return <PollWidget poll={matchedPoll} />;
    }

    case "buttonBlock": {
      const variant = node.attrs?.variant ?? "primary";
      const cls =
        variant === "primary"
          ? "bg-brand text-navy hover:bg-brand-hover shadow-sm"
          : variant === "secondary"
          ? "bg-navy text-white hover:bg-navy-light shadow-sm"
          : "border-2 border-navy text-navy hover:bg-slate-100";
      return (
        <div className="my-6 text-center">
          <a
            href={node.attrs?.url ?? "#"}
            className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition duration-150 ${cls}`}
          >
            {node.attrs?.label ?? "Learn More"}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      );
    }

    case "downloadBlock": {
      return (
        <div className="my-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-brand transition">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand">
            <DownloadIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-navy truncate">
              {node.attrs?.fileName ?? "Document.pdf"}
            </div>
            <div className="text-xs text-slate-400">
              {node.attrs?.fileSize ?? "Download File"}
            </div>
          </div>
          <a
            href={node.attrs?.url ?? "#"}
            download
            className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-navy-light transition shadow-2xs"
          >
            Download
          </a>
        </div>
      );
    }

    case "youtube":
    case "videoBlock": {
      return node.attrs?.src ? (
        <div className="my-8 overflow-hidden rounded-3xl border border-slate-200 shadow-md aspect-video bg-black">
          {node.attrs.src.includes("youtube.com") || node.attrs.src.includes("youtu.be") ? (
            <iframe
              src={node.attrs.src}
              className="h-full w-full"
              allowFullScreen
              title="YouTube Video player"
            />
          ) : (
            <video
              src={node.attrs.src}
              poster={node.attrs.poster}
              controls
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ) : null;
    }

    case "embedBlock": {
      const { provider, videoId, url } = node.attrs ?? {};
      if (provider === "youtube" && videoId) {
        return (
          <div className="my-8 overflow-hidden rounded-3xl border border-slate-200 aspect-video shadow-md bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="h-full w-full"
              allowFullScreen
              title="YouTube"
            />
          </div>
        );
      }
      if (provider === "vimeo" && videoId) {
        return (
          <div className="my-8 overflow-hidden rounded-3xl border border-slate-200 aspect-video shadow-md bg-black">
            <iframe
              src={`https://player.vimeo.com/video/${videoId}`}
              className="h-full w-full"
              allowFullScreen
              title="Vimeo"
            />
          </div>
        );
      }
      return (
        <div className="my-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Embed:{" "}
          <a
            href={url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-flame underline"
          >
            {url ?? "View external content"}
          </a>
        </div>
      );
    }

    case "gallery": {
      const images = node.attrs?.images ?? node.attrs?.items ?? [];
      if (images.length < 2) {
        return (
          <img
            src={images[0]?.src}
            alt=""
            className="rounded-2xl my-6 w-full object-cover"
            loading="lazy"
          />
        );
      }
      const layout = node.attrs?.layout ?? "grid";
      return (
        <div
          className={
            layout === "carousel"
              ? "my-6 flex gap-4 overflow-x-auto snap-x pb-2"
              : "my-6 grid grid-cols-2 gap-4"
          }
        >
          {images.map((img: any, idx: number) => (
            <img
              key={idx}
              src={img.src}
              alt={img.alt ?? ""}
              className="rounded-2xl w-full object-cover snap-center aspect-video shadow-2xs"
              loading="lazy"
            />
          ))}
        </div>
      );
    }

    case "horizontalRule":
      return <hr className="my-10 border-slate-200" />;

    default:
      if (node.content) {
        return <RenderInline content={node.content} />;
      }
      return null;
  }
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-navy bg-navy shadow-md clear-both">
      <div className="flex items-center justify-between bg-navy px-4 py-2.5 text-xs text-slate-400 border-b border-white/10">
        <span className="font-mono uppercase tracking-wider font-semibold text-slate-300">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1 font-semibold text-white hover:bg-white/20 transition text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-brand" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy Code
            </>
          )}
        </button>
      </div>
      <pre className="p-5 overflow-x-auto text-xs sm:text-sm font-mono text-slate-100 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

