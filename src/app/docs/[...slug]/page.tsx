import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { Clock, FileText } from "lucide-react";
import { DocsMarkdownRenderer } from "@/components/docs/DocsMarkdownRenderer";
import { DocsBreadcrumb } from "@/components/docs/DocsBreadcrumb";
import { DocsTableOfContents } from "@/components/docs/DocsTableOfContents";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { extractTocHeadings, DOCS_SEARCH_INDEX } from "@/lib/docsData";

export const dynamic = "force-static";
export const dynamicParams = true;

export function generateStaticParams() {
  return DOCS_SEARCH_INDEX.map((item) => ({
    slug: item.slug.split("/"),
  }));
}

export default async function DocPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  if (!slug || slug.length === 0) return notFound();

  // Decode URI components to handle encoded slugs like `api%2Fposts`
  const decodedSlug = slug.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });
  const rel = decodedSlug.join("/");
  // Sanitize to prevent directory traversal
  if (rel.includes("..") || rel.includes("//")) return notFound();

  const docsRoot = path.join(process.cwd(), "docs");
  const candidates = [
    path.join(docsRoot, `${rel}.md`),
    path.join(docsRoot, rel, "index.md"),
    path.join(docsRoot, rel, "README.md"),
    path.join(docsRoot, rel),
  ];

  let filePath = "";
  let rawContent = "";

  try {
    for (const c of candidates) {
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        if (fs.existsSync(c) && fs.statSync(c).isFile()) {
          filePath = c;
          rawContent = fs.readFileSync(c, "utf-8");
          break;
        }
        if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
          const idx = path.join(c, "index.md");
          const readme = path.join(c, "README.md");
          if (fs.existsSync(idx) && fs.statSync(idx).isFile()) {
            filePath = idx;
            rawContent = fs.readFileSync(idx, "utf-8");
            break;
          }
          if (fs.existsSync(readme) && fs.statSync(readme).isFile()) {
            filePath = readme;
            rawContent = fs.readFileSync(readme, "utf-8");
            break;
          }
        }
      } catch {
        // ignore and try next candidate
        continue;
      }
    }
  } catch (e) {
    console.warn(`[docs] error resolving ${rel}:`, e);
  }

  if (!rawContent) return notFound();

  let headings: ReturnType<typeof extractTocHeadings> = [];
  try {
    headings = extractTocHeadings(rawContent);
  } catch {
    headings = [];
  }
  const wordCount = rawContent ? rawContent.split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
      <article className="flex-1 min-w-0 w-full rounded-2xl border border-border bg-white p-6 sm:p-10 shadow-xs">
        <DocsBreadcrumb slug={decodedSlug} />

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
