import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default async function DocPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const rel = slug ? slug.join("/") : "";
  // Try docs/<rel>.md, docs/<rel>/README.md, docs/<rel>/index.md
  const candidates = [
    path.join(process.cwd(), "docs", rel + ".md"),
    path.join(process.cwd(), "docs", rel, "README.md"),
    path.join(process.cwd(), "docs", rel, "index.md"),
    path.join(process.cwd(), "docs", rel),
  ];
  let file = "";
  let raw = "";
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) { file = c; raw = fs.readFileSync(c, "utf-8"); break; }
    if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
      const readme = path.join(c, "README.md");
      if (fs.existsSync(readme)) { file = readme; raw = fs.readFileSync(readme, "utf-8"); break; }
    }
  }
  if (!raw) return notFound();

  const title = rel ? rel.split("/").pop()!.replace(/\.md$/, "").replace(/-/g, " ") : "Docs";
  return (
    <div className="overflow-hidden">
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="border-b border-border bg-[#FCFCF9] px-6 py-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-border">
            <FileText className="h-4 w-4 text-text-tertiary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-navy capitalize">{title}</h1>
            <p className="text-xs font-mono text-text-tertiary">{file.replace(process.cwd(), "").replace(/\\/g, "/")}</p>
          </div>
          <Link href="/docs" className="ml-auto hidden sm:inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-surface-raised">
            <ArrowLeft className="h-3 w-3" /> Back to docs
          </Link>
        </div>
        <div className="p-6 md:p-8">
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-text-primary bg-[#FCFCF9] border border-border rounded-xl p-6 overflow-x-auto">
            {raw}
          </pre>
          <p className="mt-4 text-xs text-text-tertiary">Source: <code className="font-mono text-xs">{file.replace(process.cwd(), "")}</code> — edit in <code>docs/</code> and it hot-reloads.</p>
        </div>
      </div>
    </div>
  );
}
