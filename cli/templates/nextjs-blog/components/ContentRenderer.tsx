import React from "react";
import Image from "next/image";
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
      return <div className="prose" dangerouslySetInnerHTML={{ __html: content }} />;
    }
  }

  // Handle standard HTML string
  if (typeof parsedContent === "string") {
    return <div className="prose" dangerouslySetInnerHTML={{ __html: parsedContent }} />;
  }

  // Handle Tiptap JSON Doc
  if (parsedContent.type === "doc" && Array.isArray(parsedContent.content)) {
    return (
      <div className="prose max-w-none text-slate-700 leading-relaxed space-y-4">
        {parsedContent.content.map((node: any, idx: number) => (
          <RenderNode key={idx} node={node} polls={polls} />
        ))}
      </div>
    );
  }

  return null;
}

function RenderNode({ node, polls }: { node: any; polls?: any[] }) {
  if (!node) return null;

  switch (node.type) {
    case "paragraph":
      return (
        <p className="text-base sm:text-lg leading-relaxed text-slate-700 my-4">
          <RenderText content={node.content} />
        </p>
      );

    case "heading": {
      const level = node.attrs?.level || 2;
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      const headingClasses: Record<number, string> = {
        1: "text-3xl sm:text-4xl font-black text-navy mt-10 mb-4 tracking-tight",
        2: "text-2xl sm:text-3xl font-extrabold text-navy mt-8 mb-3 tracking-tight",
        3: "text-xl sm:text-2xl font-bold text-navy mt-6 mb-2",
        4: "text-lg font-bold text-navy mt-4 mb-2",
      };

      return (
        <Tag className={headingClasses[level] || headingClasses[2]}>
          <RenderText content={node.content} />
        </Tag>
      );
    }

    case "blockquote":
      return (
        <blockquote className="border-l-4 border-brand bg-brand/5 pl-5 py-3 my-6 rounded-r-2xl italic text-slate-700">
          {Array.isArray(node.content) ? (
            node.content.map((child: any, i: number) => <RenderNode key={i} node={child} polls={polls} />)
          ) : (
            <RenderText content={node.content} />
          )}
        </blockquote>
      );

    case "codeBlock":
      return (
        <div className="relative my-6 rounded-2xl bg-navy text-slate-100 p-5 overflow-x-auto shadow-md font-mono text-sm leading-relaxed">
          {node.attrs?.language && (
            <div className="absolute right-3 top-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
              {node.attrs.language}
            </div>
          )}
          <pre>
            <code>
              {node.content?.map((c: any) => c.text).join("")}
            </code>
          </pre>
        </div>
      );

    case "bulletList":
      return (
        <ul className="list-disc list-inside my-4 space-y-2 text-slate-700 pl-2">
          {node.content?.map((item: any, i: number) => (
            <li key={i} className="leading-relaxed">
              {item.content?.map((child: any, ci: number) => (
                <RenderNode key={ci} node={child} polls={polls} />
              ))}
            </li>
          ))}
        </ul>
      );

    case "orderedList":
      return (
        <ol className="list-decimal list-inside my-4 space-y-2 text-slate-700 pl-2">
          {node.content?.map((item: any, i: number) => (
            <li key={i} className="leading-relaxed">
              {item.content?.map((child: any, ci: number) => (
                <RenderNode key={ci} node={child} polls={polls} />
              ))}
            </li>
          ))}
        </ol>
      );

    case "image": {
      const src = node.attrs?.src;
      const alt = node.attrs?.alt || "Article illustration";
      const caption = node.attrs?.title || node.attrs?.caption;

      if (!src) return null;

      return (
        <figure className="my-8">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
            <img
              src={src}
              alt={alt}
              className="w-full h-auto object-cover max-h-[600px]"
              loading="lazy"
            />
          </div>
          {caption && (
            <figcaption className="mt-2 text-center text-xs text-slate-500 italic">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "poll":
    case "pollBlock": {
      const pollId = node.attrs?.pollId || node.attrs?.id;
      const matchedPoll = polls?.find((p) => p.id === pollId);
      if (!matchedPoll) return null;
      return <PollWidget poll={matchedPoll} />;
    }

    case "horizontalRule":
      return <hr className="my-8 border-slate-200" />;

    default:
      if (node.content) {
        return <RenderText content={node.content} />;
      }
      return null;
  }
}

function RenderText({ content }: { content?: any[] }) {
  if (!Array.isArray(content)) return null;

  return (
    <>
      {content.map((item: any, i: number) => {
        let text = item.text || "";
        let node: React.ReactNode = text;

        if (item.marks) {
          item.marks.forEach((mark: any) => {
            if (mark.type === "bold") {
              node = <strong key="b" className="font-extrabold text-navy">{node}</strong>;
            } else if (mark.type === "italic") {
              node = <em key="i">{node}</em>;
            } else if (mark.type === "code") {
              node = (
                <code key="c" className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-navy">
                  {node}
                </code>
              );
            } else if (mark.type === "link") {
              node = (
                <a
                  key="a"
                  href={mark.attrs?.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-brand hover:underline decoration-brand/50 underline-offset-2"
                >
                  {node}
                </a>
              );
            }
          });
        }

        return <React.Fragment key={i}>{node}</React.Fragment>;
      })}
    </>
  );
}
