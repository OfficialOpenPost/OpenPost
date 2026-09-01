"use client";

import type { Editor } from "@tiptap/core";
import { ListTree, Hash, ChevronRight, FileText } from "lucide-react";
import React, { useMemo } from "react";

interface DocumentOutlineProps {
  editor: Editor | null;
  onClose?: () => void;
}

interface HeadingItem {
  id: string;
  text: string;
  level: number;
  pos: number;
}

export function DocumentOutline({ editor, onClose }: DocumentOutlineProps) {
  const headings = useMemo<HeadingItem[]>(() => {
    if (!editor) return [];

    const items: HeadingItem[] = [];
    const doc = editor.state.doc;

    doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        const text = node.textContent.trim();
        if (text) {
          items.push({
            id: `heading-${pos}`,
            text,
            level: node.attrs.level || 2,
            pos,
          });
        }
      }
    });

    return items;
  }, [editor?.state.doc]);

  const scrollToHeading = (item: HeadingItem) => {
    if (!editor) return;

    // Focus and scroll to position
    editor.chain().focus().setTextSelection(item.pos + 1).run();

    // Scroll canvas DOM node into view smoothly
    const domNode = editor.view.nodeDOM(item.pos);
    if (domNode instanceof HTMLElement) {
      domNode.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="space-y-3 text-xs text-navy p-1">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <ListTree className="h-4 w-4 text-brand" />
        <span className="font-bold text-navy">Document Outline</span>
        <span className="ml-auto font-mono text-[10px] text-text-tertiary">
          {headings.length} {headings.length === 1 ? "section" : "sections"}
        </span>
      </div>

      {headings.length === 0 ? (
        <div className="py-8 text-center text-text-tertiary">
          <Hash className="mx-auto h-6 w-6 text-text-tertiary/60 mb-2" />
          <p className="font-semibold text-xs text-navy">No headings found</p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Add Headings (H1 - H4) to structure your document outline.
          </p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
          {headings.map((h, i) => {
            const indent = Math.max(0, (h.level - 1) * 12);
            return (
              <button
                key={`${h.pos}-${i}`}
                type="button"
                onClick={() => scrollToHeading(h)}
                style={{ paddingLeft: `${indent + 8}px` }}
                className="group flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-left transition hover:bg-surface-raised hover:text-brand"
              >
                <span
                  className={`font-mono text-[10px] font-bold shrink-0 ${
                    h.level === 1
                      ? "text-brand"
                      : h.level === 2
                      ? "text-navy"
                      : "text-text-tertiary"
                  }`}
                >
                  H{h.level}
                </span>
                <span className="truncate text-xs text-text-primary group-hover:text-brand transition font-medium">
                  {h.text}
                </span>
                <ChevronRight className="ml-auto h-3 w-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
