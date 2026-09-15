"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { Editor } from "@tiptap/core";
import {
  GripVertical,
  Plus,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
} from "lucide-react";
import { getBlockLabel, getBlockIcon } from "./block-utils";
import { createPortal } from "react-dom";

interface BlockHandleProps {
  editor: Editor;
}

export function BlockHandle({ editor }: BlockHandleProps) {
  const [visible, setVisible] = useState(false);
  const [handlePos, setHandlePos] = useState<{ top: number; left: number } | null>(null);
  const [currentNodeType, setCurrentNodeType] = useState<string>("paragraph");
  const [currentNodeAttrs, setCurrentNodeAttrs] = useState<Record<string, any>>({});
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPos, setAddMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const label = useMemo(() => getBlockLabel(currentNodeType, currentNodeAttrs), [currentNodeType, currentNodeAttrs]);
  const icon = useMemo(() => getBlockIcon(currentNodeType, currentNodeAttrs), [currentNodeType, currentNodeAttrs]);

  const positionHandle = useCallback(() => {
    const { state } = editor;
    const { $from } = state.selection;
    if ($from.depth === 0) {
      setVisible(false);
      return;
    }

    const topLevelPos = $from.depth === 1 ? $from.pos : $from.before(1);
    const node = state.doc.nodeAt(topLevelPos);
    if (!node) {
      setVisible(false);
      return;
    }

    try {
      const view = editor.view;
      const coords = view.coordsAtPos(topLevelPos, -1);
      if (coords) {
        const editorEl = view.dom.closest(".openpost-editor-wrapper");
        if (editorEl) {
          const editorRect = editorEl.getBoundingClientRect();
          setHandlePos({
            top: coords.top - editorRect.top - 2,
            left: -52,
          });
          setCurrentNodeType(node.type.name);
          setCurrentNodeAttrs(node.attrs ?? {});
          setVisible(true);
          return;
        }
      }
    } catch {
      // coordsAtPos can throw for certain positions
    }
    setVisible(false);
  }, [editor]);

  useEffect(() => {
    positionHandle();
    editor.on("selectionUpdate", positionHandle);
    editor.on("transaction", positionHandle);
    return () => {
      editor.off("selectionUpdate", positionHandle);
      editor.off("transaction", positionHandle);
    };
  }, [editor, positionHandle]);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setShowMenu(false);
        setMenuPos(null);
      }
      if (addMenuRef.current && !addMenuRef.current.contains(target)) {
        setShowAddMenu(false);
        setAddMenuPos(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── ACTIONS ───

  const getTopLevelPos = useCallback(() => {
    const { state } = editor;
    const { $from } = state.selection;
    if ($from.depth === 0) return null;
    return $from.depth === 1 ? $from.pos : $from.before(1);
  }, [editor]);

  const getTopLevelIndex = useCallback(() => {
    const { state } = editor;
    const { $from } = state.selection;
    if ($from.depth === 0) return -1;
    return $from.index(0);
  }, [editor]);

  const handleMoveUp = useCallback(() => {
    const pos = getTopLevelPos();
    const index = getTopLevelIndex();
    if (pos === null || index <= 0) return;

    const { state } = editor;
    const topLevel = state.doc.resolve(pos).node(0);
    const currentNode = topLevel.child(index);
    const prevNode = topLevel.child(index - 1);

    // Store current node JSON
    const nodeJson = currentNode.toJSON();

    // Delete current node
    editor.chain().focus().deleteRange({ from: pos, to: pos + currentNode.nodeSize }).run();

    // Calculate insert position (before the previous node, which shifted left)
    const newPos = pos - prevNode.nodeSize;
    editor.chain().focus().insertContentAt(newPos, nodeJson).run();
    setShowMenu(false);
  }, [editor, getTopLevelPos, getTopLevelIndex]);

  const handleMoveDown = useCallback(() => {
    const pos = getTopLevelPos();
    const index = getTopLevelIndex();
    if (pos === null) return;

    const { state } = editor;
    const topLevel = state.doc.resolve(pos).node(0);
    if (index >= topLevel.childCount - 1) return;

    const currentNode = topLevel.child(index);
    const nextNode = topLevel.child(index + 1);

    const nodeJson = currentNode.toJSON();
    editor.chain().focus().deleteRange({ from: pos, to: pos + currentNode.nodeSize }).run();
    const newPos = pos + nextNode.nodeSize;
    editor.chain().focus().insertContentAt(newPos, nodeJson).run();
    setShowMenu(false);
  }, [editor, getTopLevelPos, getTopLevelIndex]);

  const handleDuplicate = useCallback(() => {
    const pos = getTopLevelPos();
    if (pos === null) return;
    const { state } = editor;
    const node = state.doc.nodeAt(pos);
    if (!node) return;

    const insertPos = pos + node.nodeSize;
    editor.chain().focus().insertContentAt(insertPos, node.toJSON()).run();
    setShowMenu(false);
  }, [editor, getTopLevelPos]);

  const handleDelete = useCallback(() => {
    const pos = getTopLevelPos();
    if (pos === null) return;
    const { state } = editor;
    const node = state.doc.nodeAt(pos);
    if (!node) return;

    // Don't delete if it's the last paragraph (keep at least one node)
    const topLevel = state.doc.resolve(pos).node(0);
    if (topLevel.childCount <= 1 && node.type.name === "paragraph") return;

    editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
    setShowMenu(false);
    setVisible(false);
  }, [editor, getTopLevelPos]);

  const handleAddBelow = useCallback(
    (type: string, attrs?: Record<string, any>) => {
      const pos = getTopLevelPos();
      if (pos === null) return;
      const { state } = editor;
      const currentNode = state.doc.nodeAt(pos);
      if (!currentNode) return;

      const insertPos = pos + currentNode.nodeSize;
      const newNode: any = { type, attrs: attrs || {} };
      editor.chain().focus().insertContentAt(insertPos, newNode).run();
      setShowAddMenu(false);
      setAddMenuPos(null);
    },
    [editor, getTopLevelPos]
  );

  const handleOpenMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMenuPos({ top: rect.top - 4, left: rect.right + 8 });
      setShowMenu(true);
      setShowAddMenu(false);
    },
    []
  );

  const handleOpenAddMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setAddMenuPos({ top: rect.bottom + 6, left: rect.left });
      setShowAddMenu(true);
      setShowMenu(false);
    },
    []
  );

  // Keyboard shortcuts for block operations
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.shiftKey && e.key === "ArrowUp") {
        e.preventDefault();
        handleMoveUp();
      }
      if (isMod && e.shiftKey && e.key === "ArrowDown") {
        e.preventDefault();
        handleMoveDown();
      }
      if (isMod && e.key === "d") {
        e.preventDefault();
        handleDuplicate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleMoveUp, handleMoveDown, handleDuplicate]);

  if (!visible || !handlePos) return null;

  return (
    <>
      <style>{BLOCK_HANDLE_STYLES}</style>

      {/* Block Handle positioned absolutely inside the editor wrapper */}
      <div
        ref={wrapperRef}
        className="openpost-block-handle"
        style={{ top: handlePos.top, left: handlePos.left }}
      >
        {/* Drag Handle */}
        <div
          className="op-bh-drag"
          draggable
          onDragStart={(e) => {
            const pos = getTopLevelPos();
            if (pos === null) return;
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("application/x-openpost-block", String(pos));
          }}
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Add Button */}
        <button
          className="op-bh-add"
          onClick={handleOpenAddMenu}
          title="Add block below"
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* Menu Toggle (click on label) */}
        <button
          className="op-bh-label"
          onClick={handleOpenMenu}
          title="Block options"
        >
          <span className="op-bh-label-icon">{icon}</span>
          <span className="op-bh-label-text">{label}</span>
        </button>
      </div>

      {/* Block Actions Menu */}
      {showMenu && menuPos &&
        createPortal(
          <div
            ref={menuRef}
            className="op-block-menu"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <div className="op-block-menu-header">
              <span className="op-block-menu-icon">{icon}</span>
              <span>{label}</span>
            </div>
            <div className="op-block-menu-divider" />
            <button className="op-block-menu-item" onClick={handleDuplicate}>
              <Copy className="h-3.5 w-3.5" />
              <span>Duplicate</span>
              <kbd>Ctrl+D</kbd>
            </button>
            <button className="op-block-menu-item" onClick={handleMoveUp}>
              <ArrowUp className="h-3.5 w-3.5" />
              <span>Move Up</span>
              <kbd>Ctrl+Shift+Up</kbd>
            </button>
            <button className="op-block-menu-item" onClick={handleMoveDown}>
              <ArrowDown className="h-3.5 w-3.5" />
              <span>Move Down</span>
              <kbd>Ctrl+Shift+Down</kbd>
            </button>
            <div className="op-block-menu-divider" />
            <button className="op-block-menu-item" onClick={handleOpenAddMenu}>
              <CornerDownLeft className="h-3.5 w-3.5" />
              <span>Add Block Below</span>
            </button>
            <div className="op-block-menu-divider" />
            <button className="op-block-menu-item op-block-menu-item--danger" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
              <kbd>Del</kbd>
            </button>
          </div>,
          document.body
        )}

      {/* Add Block Menu */}
      {showAddMenu && addMenuPos &&
        createPortal(
          <div
            ref={addMenuRef}
            className="op-block-add-menu"
            style={{ top: addMenuPos.top, left: addMenuPos.left }}
          >
            <div className="op-block-add-menu-header">Add Block</div>
            <div className="op-block-add-menu-grid">
              {ADD_BLOCK_OPTIONS.map((opt) => (
                <button
                  key={`${opt.type}-${opt.label}`}
                  className="op-block-add-menu-item"
                  onClick={() => handleAddBelow(opt.type, opt.attrs)}
                >
                  <span className="op-block-add-menu-item-icon">{opt.icon}</span>
                  <span className="op-block-add-menu-item-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

const ADD_BLOCK_OPTIONS = [
  { type: "paragraph", label: "Text", icon: "\u00B6", attrs: {} },
  { type: "heading", label: "Heading", icon: "H", attrs: { level: 2 } },
  { type: "heading", label: "Heading 3", icon: "H\u2083", attrs: { level: 3 } },
  { type: "bulletList", label: "Bullet List", icon: "\u2022", attrs: {} },
  { type: "orderedList", label: "Numbered List", icon: "1.", attrs: {} },
  { type: "taskList", label: "Checklist", icon: "\u2611", attrs: {} },
  { type: "blockquote", label: "Quote", icon: "\u201C", attrs: {} },
  { type: "codeBlock", label: "Code", icon: "</>", attrs: {} },
  { type: "horizontalRule", label: "Divider", icon: "\u2014", attrs: {} },
  { type: "callout", label: "Callout", icon: "\uD83D\uDCA1", attrs: { tone: "info" } },
  { type: "table", label: "Table", icon: "\u25A6", attrs: {} },
  { type: "image", label: "Image", icon: "\uD83D\uDDBC\uFE0F", attrs: { src: "", alt: "", layout: "center" } },
];

const BLOCK_HANDLE_STYLES = `
  .openpost-block-handle {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 2px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
    z-index: 40;
  }

  .openpost-editor-wrapper:hover .openpost-block-handle,
  .openpost-editor-wrapper:focus-within .openpost-block-handle {
    opacity: 1;
    pointer-events: auto;
  }

  .op-bh-drag {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    color: #94A3B8;
    cursor: grab;
    transition: all 0.12s ease;
    background: transparent;
    border: 1px solid transparent;
    user-select: none;
  }

  .op-bh-drag:hover {
    background: #F1F5F9;
    color: #475569;
    border-color: #E2E8F0;
  }

  .op-bh-drag:active {
    cursor: grabbing;
    background: #E2E8F0;
    color: #1E293B;
    transform: scale(1.1);
  }

  .op-bh-add {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    color: #94A3B8;
    cursor: pointer;
    transition: all 0.12s ease;
    background: transparent;
    border: 1px solid transparent;
    padding: 0;
  }

  .op-bh-add:hover {
    background: #FEA611;
    color: white;
    border-color: #FEA611;
    transform: scale(1.1);
  }

  .op-bh-label {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 6px;
    color: #94A3B8;
    cursor: pointer;
    transition: all 0.12s ease;
    background: transparent;
    border: 1px solid transparent;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  .op-bh-label:hover {
    background: #F1F5F9;
    color: #475569;
    border-color: #E2E8F0;
  }

  .op-bh-label-icon {
    font-size: 12px;
    line-height: 1;
  }

  .op-bh-label-text {
    line-height: 1;
  }

  .op-block-menu {
    position: fixed;
    min-width: 220px;
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
    padding: 6px;
    z-index: 9999;
    animation: op-block-menu-in 0.12s ease;
  }

  @keyframes op-block-menu-in {
    from { opacity: 0; transform: translateY(-4px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .op-block-menu-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 700;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .op-block-menu-icon {
    font-size: 14px;
    width: 20px;
    text-align: center;
  }

  .op-block-menu-divider {
    height: 1px;
    background: #F1F5F9;
    margin: 4px 6px;
  }

  .op-block-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    color: #334155;
    cursor: pointer;
    transition: all 0.1s ease;
    text-align: left;
  }

  .op-block-menu-item:hover {
    background: #F8FAFC;
    color: #0F172A;
  }

  .op-block-menu-item:active {
    background: #F1F5F9;
    transform: scale(0.98);
  }

  .op-block-menu-item--danger {
    color: #DC2626;
  }

  .op-block-menu-item--danger:hover {
    background: #FEF2F2;
    color: #DC2626;
  }

  .op-block-menu-item kbd {
    margin-left: auto;
    font-size: 10px;
    font-family: monospace;
    color: #94A3B8;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 4px;
    padding: 1px 5px;
    line-height: 1.4;
  }

  .op-block-add-menu {
    position: fixed;
    min-width: 260px;
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
    padding: 8px;
    z-index: 9999;
    animation: op-block-menu-in 0.12s ease;
  }

  .op-block-add-menu-header {
    font-size: 11px;
    font-weight: 700;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 4px 8px 8px;
  }

  .op-block-add-menu-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }

  .op-block-add-menu-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 6px;
    border: 1px solid transparent;
    background: transparent;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.12s ease;
    text-align: center;
  }

  .op-block-add-menu-item:hover {
    background: #F8FAFC;
    border-color: #E2E8F0;
  }

  .op-block-add-menu-item:active {
    background: #F1F5F9;
    transform: scale(0.96);
  }

  .op-block-add-menu-item-icon {
    font-size: 18px;
    line-height: 1;
    color: #FEA611;
  }

  .op-block-add-menu-item-label {
    font-size: 10px;
    font-weight: 600;
    color: #475569;
  }

  .openpost-editor-wrapper .tiptap > * {
    position: relative;
    transition: background-color 0.1s ease;
    border-radius: 4px;
  }

  .openpost-editor-wrapper .tiptap > *:hover {
    background-color: rgba(254, 166, 17, 0.02);
  }

  @media (max-width: 768px) {
    .openpost-block-handle {
      opacity: 0.6;
      pointer-events: auto;
    }

    .openpost-block-handle .op-bh-drag,
    .openpost-block-handle .op-bh-add {
      width: 44px;
      height: 44px;
      border-radius: 10px;
    }

    .openpost-block-handle .op-bh-label {
      padding: 4px 12px;
      font-size: 11px;
      min-height: 44px;
    }
  }
`;

export default BlockHandle;
