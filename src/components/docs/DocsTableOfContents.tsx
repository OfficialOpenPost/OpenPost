"use client";

import { useEffect, useState } from "react";
import { List, ExternalLink, MessageSquare, ArrowUp } from "lucide-react";
import { TocItem } from "@/lib/docsToc";

export function DocsTableOfContents({ headings }: { headings: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!headings || headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0% 0% -70% 0%" }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!headings || headings.length === 0) return null;

  return (
    <div className="hidden xl:block w-64 2xl:w-72 shrink-0 pl-4 pr-2">
      <div className="sticky top-20 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy mb-3">
            <List className="h-3.5 w-3.5 text-brand" /> On this page
          </div>
          <nav className="max-h-[60vh] overflow-y-auto pr-2 space-y-1 text-xs">
            {headings.map((h) => {
              const isActive = activeId === h.id;
              return (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`block py-1 leading-snug transition-colors truncate ${
                    h.level === 3 ? "pl-3 text-[11px]" : "pl-0 font-medium"
                  } ${
                    isActive
                      ? "text-brand font-bold"
                      : "text-text-secondary hover:text-navy"
                  }`}
                >
                  {h.text}
                </a>
              );
            })}
          </nav>
        </div>

        <hr className="border-border" />

        <div className="space-y-2 text-xs text-text-tertiary">
          <a
            href="https://github.com/OfficialOpenPost/OpenPost"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-text-secondary hover:text-brand transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>Edit this page on GitHub</span>
          </a>
          <a
            href="/contact"
            className="flex items-center gap-2 text-text-secondary hover:text-brand transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Ask community & support</span>
          </a>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-text-tertiary hover:text-navy pt-2 transition-colors cursor-pointer"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            <span>Back to top</span>
          </button>
        </div>
      </div>
    </div>
  );
}
