"use client";

import { useState } from "react";

interface SharedRenderProps {
  content: any;
}

function renderInline(content: any[]): string {
  if (!Array.isArray(content)) return "";
  return content.map((c: any) => {
    if (c.type === "text") {
      let t = c.text ?? "";
      if (c.marks) for (const m of c.marks) { if (m.type === "bold") t = `**${t}**`; }
      return t;
    }
    if (c.content) return renderInline(c.content);
    return c.text ?? "";
  }).join("");
}

// Shared between CMS preview and public frontend — guarantees parity (PRD §17)
// Renders 16 block types: paragraph, heading, image, gallery(min-2), callout, poll, faq(JSON-LD), accordion, button, download, social, video, embed, codeBlock(copy), blockquote, horizontalRule
export function SharedRender({ content }: SharedRenderProps) {
  if (!content || !content.content) return <p className="text-sm text-text-tertiary">No content</p>;

  const faqNodes = content.content.filter((n: any) => n.type === "faq");
  const faqJsonLd = faqNodes.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqNodes.flatMap((n: any) => {
          const items = n.attrs?.items ?? (n.attrs?.question ? [{ question: n.attrs.question, answer: renderInline(n.content ?? []) }] : []);
          return items.map((it: any) => ({ "@type": "Question", name: it.question, acceptedAnswer: { "@type": "Answer", text: it.answer } }));
        }),
      }
    : null;

  return (
    <div className="prose prose-slate max-w-none prose-headings:text-navy prose-a:text-brand prose-blockquote:border-brand prose-code:bg-navy prose-code:text-brand">
      {content.content.map((node: any, i: number) => {
        switch (node.type) {
          case "paragraph":
            return <p key={i}>{renderInline(node.content ?? []) || node.content?.map((c: any) => c.text ?? "").join("")}</p>;
          case "heading": {
            const Tag = `h${node.attrs?.level ?? 2}` as unknown as React.ComponentType<{ children: React.ReactNode }>;
            return <Tag key={i}>{renderInline(node.content ?? []) || node.content?.map((c: any) => c.text).join("")}</Tag>;
          }
          case "image": {
            const src = node.attrs?.src ?? "";
            const srcSet = src ? `${src}?w=480 480w, ${src}?w=768 768w, ${src}?w=1200 1200w, ${src}?w=1920 1920w` : undefined;
            return (
              <figure key={i} className="my-6">
                <img src={src} srcSet={srcSet} sizes="(max-width: 768px) 100vw, 720px" alt={node.attrs?.alt ?? ""} className="rounded-xl w-full" loading="lazy" />
                {node.attrs?.caption && <figcaption className="mt-2 text-center text-xs text-text-tertiary">{node.attrs.caption}</figcaption>}
              </figure>
            );
          }
          case "callout": {
            const tone = node.attrs?.tone ?? "info";
            const toneCls: Record<string, string> = { info: "border-brand bg-brand/5", warning: "border-orange bg-orange/5", success: "border-green-500 bg-green-50", note: "border-navy bg-navy/5 text-white" };
            return <div key={i} className={`my-6 rounded-xl border-l-4 p-4 ${toneCls[tone] ?? toneCls.info}`}>{renderInline(node.content ?? [])}</div>;
          }
          case "poll":
          case "pollBlock":
            return <div key={i} className="my-6 rounded-xl border border-border bg-white p-4 text-sm border-l-4 border-l-brand">Poll: {node.attrs?.question ?? "Poll"} <span className="text-text-tertiary">— vote via API</span></div>;
          case "gallery": {
            const images = node.attrs?.images ?? node.attrs?.items ?? [];
            if (images.length < 2) return <img key={i} src={images[0]?.src} alt="" className="rounded-xl my-6" loading="lazy" />;
            const layout = node.attrs?.layout ?? "grid";
            return (
              <div key={i} className={layout === "carousel" ? "my-6 flex gap-4 overflow-x-auto snap-x pb-2" : "my-6 grid grid-cols-2 gap-4"}>
                {images.map((img: any, idx: number) => {
                  const srcSet = img.src ? `${img.src}?w=480 480w, ${img.src}?w=768 768w, ${img.src}?w=1200 1200w` : undefined;
                  return <img key={idx} src={img.src} srcSet={srcSet} sizes="(max-width: 768px) 50vw, 360px" alt={img.alt ?? ""} className="rounded-xl w-full object-cover snap-center" loading="lazy" />;
                })}
              </div>
            );
          }
          case "faq": {
            const items = node.attrs?.items ?? (node.attrs?.question ? [{ question: node.attrs.question, answer: renderInline(node.content ?? []) || "Answer" }] : []);
            return (
              <div key={i} className="my-6 rounded-xl border border-border bg-surface overflow-hidden">
                <div className="bg-navy px-4 py-3 text-sm font-bold text-white">FAQ</div>
                {items.map((it: any, idx: number) => (
                  <details key={idx} className="border-t border-border first:border-0 group" open={idx === 0}>
                    <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-navy flex justify-between items-center hover:bg-surface-raised">
                      {it.question} <span className="text-brand group-open:rotate-180 transition">⌄</span>
                    </summary>
                    <div className="px-4 pb-4 text-sm text-text-secondary">{it.answer}</div>
                  </details>
                ))}
              </div>
            );
          }
          case "accordion": {
            const items = node.attrs?.items ?? [];
            return (
              <div key={i} className="my-6 rounded-xl border border-border bg-surface overflow-hidden divide-y divide-border">
                {items.map((it: any, idx: number) => (
                  <details key={idx} className="group" open={idx === 0}>
                    <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-navy flex justify-between items-center hover:bg-surface-raised">
                      {it.title} <span className="text-brand group-open:rotate-180 transition">⌄</span>
                    </summary>
                    <div className="px-4 pb-4 text-sm text-text-secondary">{it.content}</div>
                  </details>
                ))}
              </div>
            );
          }
          case "buttonBlock": {
            const variant = node.attrs?.variant ?? "primary";
            const cls = variant === "primary" ? "bg-brand text-navy" : variant === "secondary" ? "bg-navy text-white" : "border border-navy text-navy";
            return <div key={i} className="my-6 text-center"><a href={node.attrs?.url ?? "#"} className={`inline-flex rounded-xl px-6 py-3 text-sm font-bold ${cls}`}>{node.attrs?.label ?? "Button"}</a></div>;
          }
          case "downloadBlock":
            return <div key={i} className="my-6 flex items-center gap-4 rounded-xl border border-border bg-surface-raised p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">⬇</div><div><div className="text-sm font-bold text-navy">{node.attrs?.fileName ?? "file.pdf"}</div><div className="text-xs text-text-tertiary">{node.attrs?.fileSize ?? ""}</div></div><a href={node.attrs?.url ?? "#"} className="ml-auto rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white">Download</a></div>;
          case "socialEmbed":
            return <div key={i} className="my-6 rounded-xl border border-border bg-surface p-6 text-center text-sm text-text-tertiary">Social — {node.attrs?.provider ?? "embed"} <a href={node.attrs?.url ?? "#"} className="text-brand underline">{node.attrs?.url ?? ""}</a></div>;
          case "videoBlock":
            return node.attrs?.src ? <div key={i} className="my-6 overflow-hidden rounded-xl border border-border"><video src={node.attrs.src} poster={node.attrs.poster} controls className="w-full" /></div> : <div key={i} className="my-6 rounded-xl border-2 border-dashed border-border p-8 text-center text-sm text-text-tertiary bg-surface-raised">Video — no source</div>;
          case "embedBlock": {
            const { provider, videoId } = node.attrs ?? {};
            if (provider === "youtube" && videoId) return <div key={i} className="my-6 overflow-hidden rounded-xl border border-border aspect-video"><iframe src={`https://www.youtube.com/embed/${videoId}`} className="h-full w-full" allowFullScreen title="YouTube" /></div>;
            if (provider === "vimeo" && videoId) return <div key={i} className="my-6 overflow-hidden rounded-xl border border-border aspect-video"><iframe src={`https://player.vimeo.com/video/${videoId}`} className="h-full w-full" allowFullScreen title="Vimeo" /></div>;
            return <div key={i} className="my-6 rounded-xl border border-border bg-surface p-6 text-center text-sm text-text-tertiary">Embed — {node.attrs?.url ?? "no URL"}</div>;
          }
          case "codeBlock": {
            const code = renderInline(node.content ?? []) || node.content?.map((c: any) => c.text).join("\n") || "";
            return <CodeBlock key={i} code={code} language={node.attrs?.language} />;
          }
          case "blockquote":
            return <blockquote key={i} className="my-6 border-l-4 border-brand bg-brand/5 pl-6 py-4 italic text-text-secondary rounded-r-xl">{renderInline(node.content ?? [])}</blockquote>;
          case "horizontalRule":
            return <hr key={i} className="my-8 border-border" />;
          case "bulletList":
            return <ul key={i} className="list-disc pl-6 my-4 space-y-2 marker:text-brand">{node.content?.map((li: any, idx: number) => <li key={idx}>{renderInline(li.content?.[0]?.content ?? li.content ?? [])}</li>)}</ul>;
          case "orderedList":
            return <ol key={i} className="list-decimal pl-6 my-4 space-y-2 marker:text-brand marker:font-bold">{node.content?.map((li: any, idx: number) => <li key={idx}>{renderInline(li.content?.[0]?.content ?? li.content ?? [])}</li>)}</ol>;
          case "table":
            return <div key={i} className="my-6 overflow-x-auto"><table className="w-full border-collapse rounded-xl overflow-hidden border border-border"><tbody>{node.content?.map((row: any, r: number) => <tr key={r} className="border-b border-border last:border-0">{row.content?.map((cell: any, c: number) => { const Tag2 = cell.type === "tableHeader" ? "th" : "td"; return <Tag2 key={c} className={cell.type === "tableHeader" ? "bg-navy text-white p-3 text-left font-bold border-r border-white/10" : "p-3 border-r border-border bg-surface"}>{renderInline(cell.content?.[0]?.content ?? cell.content ?? [])}</Tag2>; })}</tr>)}</tbody></table></div>;
          case "taskList":
            return <ul key={i} className="my-4 space-y-2 list-none">{node.content?.map((li: any, idx: number) => <li key={idx} className="flex gap-2"><input type="checkbox" checked={li.attrs?.checked} readOnly />{renderInline(li.content?.[0]?.content ?? [])}</li>)}</ul>;
          default:
            return <div key={i} className="my-4 text-sm text-text-tertiary">[{node.type} block]</div>;
        }
      })}
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <div className="my-6 overflow-hidden rounded-xl border border-navy bg-navy">
      <div className="flex items-center justify-between bg-navy px-4 py-2 text-xs text-slate-400 border-b border-white/10">
        <span className="font-mono">{language ?? "code"}</span>
        <button onClick={copy} className="rounded-lg bg-white/10 px-3 py-1 font-semibold text-white hover:bg-white/20 transition">{copied ? "Copied!" : "Copy"}</button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-100"><code>{code}</code></pre>
    </div>
  );
}
