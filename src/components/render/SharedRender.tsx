"use client";

interface SharedRenderProps {
  content: any;
}

// Shared between CMS preview and public frontend — guarantees parity (PRD §17)
export function SharedRender({ content }: SharedRenderProps) {
  if (!content || !content.content) return <p className="text-sm text-text-tertiary">No content</p>;

  return (
    <div className="prose prose-slate max-w-none prose-headings:text-navy prose-a:text-brand prose-blockquote:border-brand prose-code:bg-navy prose-code:text-brand">
      {content.content.map((node: any, i: number) => {
        switch (node.type) {
          case "paragraph":
            return <p key={i}>{node.content?.map((c: any, j: number) => c.text ?? "").join("")}</p>;
          case "heading":
            const Tag = `h${node.attrs?.level ?? 2}` as unknown as React.ComponentType<{ children: React.ReactNode }>;
            return <Tag key={i}>{node.content?.map((c: any) => c.text).join("")}</Tag>;
          case "image":
            return <img key={i} src={node.attrs?.src} alt={node.attrs?.alt ?? ""} className="rounded-xl my-6" />;
          case "callout":
            return <div key={i} className="my-6 rounded-xl border-l-4 border-brand bg-brand/5 p-4">{node.content?.map((c: any) => c.text).join("")}</div>;
          case "pollBlock":
            return <div key={i} className="my-6 rounded-xl border border-border bg-white p-4 text-sm">Poll: {node.attrs?.question}</div>;
          case "gallery":
            return <div key={i} className="my-6 rounded-xl border border-border p-4">Gallery</div>;
          default:
            return <div key={i} className="my-4 text-sm text-text-tertiary">[{node.type} block]</div>;
        }
      })}
    </div>
  );
}
