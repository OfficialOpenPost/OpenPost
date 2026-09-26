"use client";

import { useEffect } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { TextSelection, AllSelection } from "@tiptap/pm/state";

export interface BlockContext {
  pos: number;
  index: number;
  node: PMNode;
}

export interface BlockOption {
  key: string;
  label: string;
  icon: string;
  insert: (editor: Editor) => boolean;
}

/**
 * Resolves the top-level block that owns the start of the current selection.
 * `$from.depth` is 0 when the position sits on a top-level node boundary
 * (node selection / document edge) and >= 1 when strictly inside a block.
 */
export function getBlockTopLevel(editor: Editor | null): BlockContext | null {
  if (!editor || editor.isDestroyed || !editor.view) return null;

  const { state } = editor;
  const { $from } = state.selection;
  const pos = $from.depth === 0 ? $from.pos : $from.before(1);

  if (pos < 0 || pos > state.doc.content.size) return null;

  const node = state.doc.nodeAt(pos);
  if (!node || !node.isBlock) return null;

  const index = state.doc.resolve(pos).index(0);
  if (index < 0 || index >= state.doc.childCount) return null;

  return { pos, index, node };
}

function focusInsertedBlock(editor: Editor, pos: number) {
  try {
    const doc = editor.state.doc;
    const selection = TextSelection.near(doc.resolve(Math.min(pos, doc.content.size)));
    if (selection && !(selection instanceof AllSelection)) {
      editor.view.dispatch(editor.state.tr.setSelection(selection).scrollIntoView());
    }
  } catch {
    // Never block the insertion itself if caret placement fails.
  }
}

export function insertBlockBelow(editor: Editor, content: JSONContent): boolean {
  const ctx = getBlockTopLevel(editor);
  if (!ctx) return false;

  const insertPos = ctx.pos + ctx.node.nodeSize;
  const done = editor.chain().focus().insertContentAt(insertPos, content).run();
  if (!done) return false;

  focusInsertedBlock(editor, insertPos);
  return true;
}

export function duplicateBlock(editor: Editor): boolean {
  const ctx = getBlockTopLevel(editor);
  if (!ctx) return false;

  return editor
    .chain()
    .focus()
    .insertContentAt(ctx.pos + ctx.node.nodeSize, ctx.node.toJSON())
    .run();
}

export function moveBlockUp(editor: Editor): boolean {
  const ctx = getBlockTopLevel(editor);
  if (!ctx || ctx.index <= 0) return false;

  const doc = editor.state.doc;
  const current = doc.child(ctx.index);
  const previous = doc.child(ctx.index - 1);
  const json = current.toJSON();

  const removed = editor
    .chain()
    .focus()
    .deleteRange({ from: ctx.pos, to: ctx.pos + current.nodeSize })
    .run();
  if (!removed) return false;

  return editor.chain().focus().insertContentAt(ctx.pos - previous.nodeSize, json).run();
}

export function moveBlockDown(editor: Editor): boolean {
  const ctx = getBlockTopLevel(editor);
  if (!ctx || ctx.index >= editor.state.doc.childCount - 1) return false;

  const doc = editor.state.doc;
  const current = doc.child(ctx.index);
  const next = doc.child(ctx.index + 1);
  const json = current.toJSON();

  const removed = editor
    .chain()
    .focus()
    .deleteRange({ from: ctx.pos, to: ctx.pos + current.nodeSize })
    .run();
  if (!removed) return false;

  return editor.chain().focus().insertContentAt(ctx.pos + next.nodeSize, json).run();
}

export function deleteBlock(editor: Editor): boolean {
  const ctx = getBlockTopLevel(editor);
  if (!ctx) return false;

  // Keep at least one block in the document.
  if (editor.state.doc.childCount <= 1) return false;

  return editor
    .chain()
    .focus()
    .deleteRange({ from: ctx.pos, to: ctx.pos + ctx.node.nodeSize })
    .run();
}

function buildTableContent(): JSONContent {
  const cells = (type: "tableHeader" | "tableCell"): JSONContent[] =>
    [0, 1, 2].map(() => ({ type, content: [{ type: "paragraph" }] }));

  return {
    type: "table",
    content: [
      { type: "tableRow", content: cells("tableHeader") },
      { type: "tableRow", content: cells("tableCell") },
      { type: "tableRow", content: cells("tableCell") },
    ],
  };
}

export const ADD_BLOCK_OPTIONS: BlockOption[] = [
  {
    key: "paragraph",
    label: "Text",
    icon: "\u00B6",
    insert: (editor) => insertBlockBelow(editor, { type: "paragraph" }),
  },
  {
    key: "heading-2",
    label: "Heading",
    icon: "H",
    insert: (editor) => insertBlockBelow(editor, { type: "heading", attrs: { level: 2 } }),
  },
  {
    key: "heading-3",
    label: "Heading 3",
    icon: "H\u2083",
    insert: (editor) => insertBlockBelow(editor, { type: "heading", attrs: { level: 3 } }),
  },
  {
    key: "bullet-list",
    label: "Bullet List",
    icon: "\u2022",
    insert: (editor) =>
      insertBlockBelow(editor, {
        type: "bulletList",
        content: [{ type: "listItem", content: [{ type: "paragraph" }] }],
      }),
  },
  {
    key: "ordered-list",
    label: "Numbered List",
    icon: "1.",
    insert: (editor) =>
      insertBlockBelow(editor, {
        type: "orderedList",
        content: [{ type: "listItem", content: [{ type: "paragraph" }] }],
      }),
  },
  {
    key: "task-list",
    label: "Checklist",
    icon: "\u2611",
    insert: (editor) =>
      insertBlockBelow(editor, {
        type: "taskList",
        content: [{ type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph" }] }],
      }),
  },
  {
    key: "blockquote",
    label: "Quote",
    icon: "\u201C",
    insert: (editor) =>
      insertBlockBelow(editor, { type: "blockquote", content: [{ type: "paragraph" }] }),
  },
  {
    key: "code-block",
    label: "Code",
    icon: "</>",
    insert: (editor) => insertBlockBelow(editor, { type: "codeBlock" }),
  },
  {
    key: "divider",
    label: "Divider",
    icon: "\u2014",
    insert: (editor) => insertBlockBelow(editor, { type: "horizontalRule" }),
  },
  {
    key: "callout",
    label: "Callout",
    icon: "\uD83D\uDCA1",
    insert: (editor) =>
      insertBlockBelow(editor, {
        type: "callout",
        attrs: { tone: "info" },
        content: [{ type: "paragraph" }],
      }),
  },
  {
    key: "table",
    label: "Table",
    icon: "\u25A6",
    insert: (editor) => insertBlockBelow(editor, buildTableContent()),
  },
  {
    key: "image",
    label: "Image",
    icon: "\uD83D\uDDBC\uFE0F",
    insert: (editor) =>
      insertBlockBelow(editor, { type: "image", attrs: { src: "", alt: "", layout: "center" } }),
  },
];

/**
 * Block shortcuts: Ctrl/Cmd+D duplicate, Ctrl/Cmd+Shift+↑/↓ reorder.
 * Only active while the editor itself has focus so other inputs are untouched.
 */
export function useBlockKeyboardShortcuts(editor: Editor | null) {
  useEffect(() => {
    if (!editor) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (editor.isDestroyed || !editor.view.hasFocus()) return;

      const isMod = event.ctrlKey || event.metaKey;
      if (!isMod) return;

      if (event.shiftKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault();
        if (event.key === "ArrowUp") moveBlockUp(editor);
        else moveBlockDown(editor);
        return;
      }

      if (!event.shiftKey && !event.altKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateBlock(editor);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor]);
}
