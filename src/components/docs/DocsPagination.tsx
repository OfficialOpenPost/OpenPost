import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DOCS_SEARCH_INDEX } from "@/lib/docsData";

export function DocsPagination({ currentSlug }: { currentSlug: string }) {
  const currentIndex = DOCS_SEARCH_INDEX.findIndex((item) => item.slug === currentSlug);

  const prev = currentIndex > 0 ? DOCS_SEARCH_INDEX[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < DOCS_SEARCH_INDEX.length - 1 ? DOCS_SEARCH_INDEX[currentIndex + 1] : null;

  if (!prev && !next) return null;

  return (
    <div className="mt-14 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
      {prev ? (
        <Link
          href={`/docs/${prev.slug}`}
          className="group flex items-center gap-3.5 p-4 rounded-xl border border-border bg-[#FCFCF9]/60 hover:border-brand/40 hover:bg-surface-raised/80 hover:shadow-xs transition-all"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-text-tertiary group-hover:border-brand/30 group-hover:text-brand group-hover:-translate-x-0.5 transition-all shadow-2xs">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary group-hover:text-brand transition-colors">
              Previous
            </span>
            <span className="block text-sm font-bold text-navy group-hover:text-brand truncate transition-colors">
              {prev.title}
            </span>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/docs/${next.slug}`}
          className="group flex items-center justify-between sm:justify-end gap-3.5 p-4 rounded-xl border border-border bg-[#FCFCF9]/60 hover:border-brand/40 hover:bg-surface-raised/80 hover:shadow-xs transition-all sm:col-start-2 text-right"
        >
          <div className="min-w-0 order-1 sm:order-1 text-left sm:text-right">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary group-hover:text-brand transition-colors">
              Next
            </span>
            <span className="block text-sm font-bold text-navy group-hover:text-brand truncate transition-colors">
              {next.title}
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-text-tertiary group-hover:border-brand/30 group-hover:text-brand group-hover:translate-x-0.5 transition-all shadow-2xs order-2 sm:order-2">
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      ) : null}
    </div>
  );
}
