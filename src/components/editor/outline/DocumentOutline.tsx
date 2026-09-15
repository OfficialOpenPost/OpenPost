"use client";

import type { Editor } from "@tiptap/core";
import { ListTree, Hash, ChevronRight } from "lucide-react";
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";

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

interface TreeNode {
  item: HeadingItem;
  children: TreeNode[];
}

function buildTree(items: HeadingItem[]): TreeNode[] {
  const root: TreeNode[] = [];
  const stack: { node: TreeNode; level: number }[] = [];

  for (const item of items) {
    const treeNode: TreeNode = { item, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(treeNode);
    } else {
      stack[stack.length - 1].node.children.push(treeNode);
    }

    stack.push({ node: treeNode, level: item.level });
  }

  return root;
}

function TreeNodeView({
  node,
  depth,
  isLast,
  parentPrefix,
  activeId,
  onScroll,
}: {
  node: TreeNode;
  depth: number;
  isLast: boolean;
  parentPrefix: string;
  activeId: string | null;
  onScroll: (item: HeadingItem) => void;
}) {
  const connector = depth === 0 ? "" : isLast ? "└── " : "├── ";
  const childPrefix = depth === 0 ? "" : isLast ? "    " : "│   ";
  const isActive = activeId === node.item.id;
  const indent = depth * 16;

  return (
    <div>
      <button
        type="button"
        onClick={() => onScroll(node.item)}
        title={node.item.text}
        className={`group flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left transition ${
          isActive
            ? "bg-brand/10 text-brand"
            : "text-text-secondary hover:bg-surface-raised hover:text-navy"
        }`}
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {depth > 0 && (
          <span className="font-mono text-[10px] text-text-tertiary select-none shrink-0">
            {parentPrefix}
            {connector}
          </span>
        )}
        <span
          className={`font-mono text-[10px] font-bold shrink-0 ${
            isActive
              ? "text-brand"
              : node.item.level === 1
              ? "text-brand"
              : node.item.level === 2
              ? "text-navy"
              : "text-text-tertiary"
          }`}
        >
          H{node.item.level}
        </span>
        <span
          className={`truncate text-xs transition font-medium ${
            isActive ? "text-brand font-semibold" : "text-text-primary group-hover:text-brand"
          }`}
        >
          {node.item.text}
        </span>
        <ChevronRight className="ml-auto h-3 w-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition shrink-0" />
      </button>
      {node.children.length > 0 && (
        <div>
          {node.children.map((child, i) => (
            <TreeNodeView
              key={child.item.id}
              node={child}
              depth={depth + 1}
              isLast={i === node.children.length - 1}
              parentPrefix={parentPrefix + childPrefix}
              activeId={activeId}
              onScroll={onScroll}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocumentOutline({ editor, onClose }: DocumentOutlineProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const headingMapRef = useRef<Map<number, string>>(new Map());

  const headings = useMemo<HeadingItem[]>(() => {
    if (!editor) return [];

    const items: HeadingItem[] = [];
    const doc = editor.state.doc;

    doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        const text = node.textContent.trim();
        if (text) {
          const id = `heading-${pos}`;
          items.push({ id, text, level: node.attrs.level || 2, pos });
          headingMapRef.current.set(pos, id);
        }
      }
    });

    return items;
  }, [editor?.state.doc]);

  const tree = useMemo(() => buildTree(headings), [headings]);

  const scrollToHeading = useCallback(
    (item: HeadingItem) => {
      if (!editor) return;

      editor.chain().focus().setTextSelection(item.pos + 1).run();

      const domNode = editor.view.nodeDOM(item.pos);
      if (domNode instanceof HTMLElement) {
        domNode.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      setActiveId(item.id);
    },
    [editor]
  );

  // IntersectionObserver to track the currently visible heading
  useEffect(() => {
    const editorEl = document.querySelector(".openpost-editor-wrapper");
    if (!editorEl || headings.length === 0) return;

    observerRef.current?.disconnect();

    const headingEls = headings
      .map((h) => {
        const domNode = editor?.view.nodeDOM(h.pos);
        return domNode instanceof HTMLElement ? domNode : null;
      })
      .filter(Boolean) as HTMLElement[];

    if (headingEls.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Find the heading item whose DOM matches this entry
            const matched = headings.find((h) => {
              const domNode = editor?.view.nodeDOM(h.pos);
              return domNode === entry.target;
            });
            if (matched) {
              setActiveId(matched.id);
              break;
            }
          }
        }
      },
      {
        root: editorEl,
        rootMargin: "-10% 0px -70% 0px",
        threshold: 0,
      }
    );

    headingEls.forEach((el) => observerRef.current!.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings, editor]);

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
        <div className="space-y-0.5 max-h-[70vh] overflow-y-auto pr-1">
          {tree.map((node, i) => (
            <TreeNodeView
              key={node.item.id}
              node={node}
              depth={0}
              isLast={i === tree.length - 1}
              parentPrefix=""
              activeId={activeId}
              onScroll={scrollToHeading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
