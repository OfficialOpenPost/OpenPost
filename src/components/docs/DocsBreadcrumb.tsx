import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export function DocsBreadcrumb({ slug }: { slug: string[] }) {
  const parts = slug.map((part) => ({
    label: part.replace(/-/g, " ").replace(/\.md$/, ""),
    slug: part,
  }));

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-text-tertiary mb-6" aria-label="Breadcrumb">
      <Link href="/docs" className="flex items-center gap-1 hover:text-navy transition-colors">
        <Home className="h-3.5 w-3.5" />
        <span>Docs</span>
      </Link>
      {parts.map((p, index) => {
        const isLast = index === parts.length - 1;
        const href = `/docs/${slug.slice(0, index + 1).join("/")}`;

        return (
          <div key={href} className="flex items-center space-x-1.5">
            <ChevronRight className="h-3 w-3 text-text-tertiary/60" />
            {isLast ? (
              <span className="font-semibold text-navy capitalize">{p.label}</span>
            ) : (
              <Link href={href} className="capitalize hover:text-navy transition-colors">
                {p.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
