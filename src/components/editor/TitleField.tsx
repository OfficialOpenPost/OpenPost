"use client";

import { useState, useEffect } from "react";
import { slugify } from "@/lib/slug";

interface TitleFieldProps {
  title: string;
  slug: string;
  onTitleChange: (title: string) => void;
  onSlugChange: (slug: string) => void;
}

export function TitleField({ title, slug, onTitleChange, onSlugChange }: TitleFieldProps) {
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);

  useEffect(() => {
    if (!slugManuallyEdited && title) {
      onSlugChange(slugify(title));
    }
  }, [title, slugManuallyEdited, onSlugChange]);

  return (
    <div className="mx-auto max-w-[900px] px-8 md:px-12 pt-10 pb-4">
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Post title…"
        className="w-full bg-transparent text-4xl font-extrabold tracking-tight text-navy placeholder:text-text-tertiary focus:outline-none leading-tight"
      />
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="text-text-tertiary">Slug:</span>
        {editingSlug ? (
          <input
            autoFocus
            value={slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              onSlugChange(slugify(e.target.value));
            }}
            onBlur={() => setEditingSlug(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditingSlug(false)}
            className="flex-1 rounded-lg border border-border bg-surface-raised px-3 py-1.5 font-mono text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingSlug(true)}
            className="font-mono text-sm text-brand hover:text-flame underline decoration-brand/30 hover:decoration-flame underline-offset-4 transition"
          >
            /{slug || "untitled"}
          </button>
        )}
        {slugManuallyEdited && (
          <button
            type="button"
            onClick={() => {
              setSlugManuallyEdited(false);
              onSlugChange(slugify(title));
            }}
            className="text-xs text-text-tertiary hover:text-text-primary underline"
          >
            auto-sync
          </button>
        )}
      </div>
    </div>
  );
}
