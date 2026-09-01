import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { Clock, FileText } from "lucide-react";
import { DocsMarkdownRenderer } from "@/components/docs/DocsMarkdownRenderer";
import { DocsBreadcrumb } from "@/components/docs/DocsBreadcrumb";
import { DocsTableOfContents } from "@/components/docs/DocsTableOfContents";
import { extractTocHeadings } from "@/lib/docsData";
import { DocsPagination } from "@/components/docs/DocsPagination";

export default async function DocPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  if (!slug || slug.length === 0) return notFound();

  const rel = slug.join("/");
  
  // Try candidates in order
  const candidates = [
    path.join(process.cwd(), "docs", `${rel}.md`),
    path.join(process.cwd(), "docs", rel, "index.md"),
    path.join(process.cwd(), "docs", rel, "README.md"),
    path.join(process.cwd(), "docs", rel),
  ];

  let filePath = "";
  let rawContent = "";

  for (const c of candidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ c) && fs.statSync(/*turbopackIgnore: true*/ c).isFile()) {
      filePath = c;
      rawContent = fs.readFileSync(/*turbopackIgnore: true*/ c, "utf-8");
      break;
    }
    if (fs.existsSync(/*turbopackIgnore: true*/ c) && fs.statSync(/*turbopackIgnore: true*/ c).isDirectory()) {
      const idx = path.join(c, "index.md");
      const readme = path.join(c, "README.md");
      if (fs.existsSync(/*turbopackIgnore: true*/ idx)) {
        filePath = idx;
        rawContent = fs.readFileSync(/*turbopackIgnore: true*/ idx, "utf-8");
        break;
      }
      if (fs.existsSync(/*turbopackIgnore: true*/ readme)) {
        filePath = readme;
        rawContent = fs.readFileSync(/*turbopackIgnore: true*/ readme, "utf-8");
        break;
      }
    }
  }

  if (!rawContent) return notFound();

  const headings = extractTocHeadings(rawContent);
  const wordCount = rawContent.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
      <article className="flex-1 min-w-0 w-full rounded-2xl border border-border bg-white p-6 sm:p-10 shadow-xs">
        <DocsBreadcrumb slug={slug} />

        <div className="flex items-center gap-4 text-xs text-text-tertiary pb-6 mb-6 border-b border-border">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-brand" />
            <span>{readTime} min read</span>
          </span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <FileText className="h-3.5 w-3.5 text-text-tertiary" />
            <span>docs/{rel}.md</span>
          </span>
        </div>

        <DocsMarkdownRenderer content={rawContent} />

        <DocsPagination currentSlug={rel} />
      </article>

      <DocsTableOfContents headings={headings} />
    </div>
  );
}
