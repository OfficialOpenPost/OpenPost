"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { type Editor } from "@tiptap/react";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
  pos: number;
}

interface TableOfContentsProps {
  editor: Editor;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function TableOfContents({ editor }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const extractHeadings = useCallback(() => {
    const headings: TocItem[] = [];
    const json = editor.getJSON();
    if (!json.content) return;

    let pos = 0;
    const walk = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.type === "heading" && node.attrs?.level >= 2 && node.attrs?.level <= 4) {
          const text = node.content?.map((c: any) => c.text ?? "").join("") ?? "";
          if (text.trim()) {
            headings.push({
              id: slugify(text),
              text: text.trim(),
              level: node.attrs.level,
              pos,
            });
          }
        }
        if (node.content) walk(node.content);
        pos++;
      }
    };
    walk(json.content);
    setItems(headings);
  }, [editor]);

  useEffect(() => {
    extractHeadings();
    editor.on("update", extractHeadings);
    return () => {
      editor.off("update", extractHeadings);
    };
  }, [editor, extractHeadings]);

  // Intersection observer for active heading tracking
  useEffect(() => {
    const editorEl = document.querySelector(".openpost-editor-wrapper");
    if (!editorEl || items.length === 0) return;

    observerRef.current?.disconnect();

    const headingEls = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (headingEls.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        root: editorEl,
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    headingEls.forEach((el) => observerRef.current!.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [items]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Also set active
      setActiveId(id);
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-4 text-center">
        <List className="h-8 w-8 mx-auto text-slate-300 mb-2" />
        <p className="text-xs text-text-tertiary">
          Add headings (H2–H4) to see the table of contents
        </p>
      </div>
    );
  }

  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const indent = item.level === 2 ? 0 : item.level === 3 ? 1 : 2;
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => scrollToHeading(item.id)}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition truncate ${
              isActive
                ? "bg-brand/10 text-brand font-semibold"
                : "text-text-secondary hover:bg-surface-raised hover:text-navy"
            }`}
            style={{ paddingLeft: `${12 + indent * 16}px` }}
            title={item.text}
          >
            {item.text}
          </button>
        );
      })}
    </nav>
  );
}
