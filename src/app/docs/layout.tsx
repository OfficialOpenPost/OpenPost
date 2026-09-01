import Link from "next/link";
import { BookOpen } from "lucide-react";
import fs from "fs";
import path from "path";

function getDocsTree(dir: string, base = "docs"): { name: string; path: string; children?: any[] }[] {
  const full = path.join(process.cwd(), dir);
  if (!fs.existsSync(full)) return [];
  const entries = fs.readdirSync(full, { withFileTypes: true });
  return entries
    .filter(e => !e.name.startsWith("."))
    .sort((a,b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1))
    .map(e => {
      const rel = path.join(base, e.name).replace(/\\/g, "/");
      const abs = path.join(full, e.name);
      if (e.isDirectory()) {
        const kids = getDocsTree(path.join(dir, e.name), rel);
        return { name: e.name, path: rel, children: kids };
      }
      return { name: e.name, path: rel };
    });
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const tree = getDocsTree("docs");
  const renderTree = (nodes: any[], depth = 0) => (
    <ul className={depth === 0 ? "space-y-1" : "ml-3 mt-1 space-y-1 border-l border-border pl-3"}>
      {nodes.map((n: any) => (
        <li key={n.path}>
          {n.children ? (
            <details open={depth < 1}>
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-text-tertiary hover:text-navy list-none flex items-center gap-1">
                <span className="text-[10px]">▸</span> {n.name}
              </summary>
              {renderTree(n.children, depth + 1)}
            </details>
          ) : (
            <Link href={`/docs/${n.path.replace(/^docs\//, "").replace(/\.md$/, "")}`} className="block rounded-lg px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-raised hover:text-navy truncate">
              {n.name.replace(/\.md$/, "")}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex gap-8">
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-20 rounded-xl border border-border bg-white p-4">
            <div className="flex items-center gap-2 text-navy font-bold">
              <BookOpen className="h-4 w-4 text-brand" /> Docs
            </div>
            <p className="mt-1 text-xs text-text-tertiary">{tree.length} sections</p>
            <div className="mt-4 max-h-[70vh] overflow-y-auto pr-2 -mr-2">
              {renderTree(tree)}
            </div>
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
