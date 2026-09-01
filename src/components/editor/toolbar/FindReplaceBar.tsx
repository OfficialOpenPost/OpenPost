"use client";

import type { Editor } from "@tiptap/core";
import {
  Search,
  Replace,
  ChevronUp,
  ChevronDown,
  X,
  CaseSensitive,
  Check,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

interface FindReplaceBarProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FindReplaceBar({ editor, isOpen, onClose }: FindReplaceBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matches, setMatches] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showReplace, setShowReplace] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm("");
      setMatches([]);
      setCurrentIndex(-1);
    }
  }, [isOpen]);

  // Find matches across document
  useEffect(() => {
    if (!editor || !searchTerm) {
      setMatches([]);
      setCurrentIndex(-1);
      return;
    }

    const doc = editor.state.doc;
    const found: number[] = [];
    const text = doc.textBetween(0, doc.content.size, "\n", "\n");
    const query = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    const source = caseSensitive ? text : text.toLowerCase();

    let pos = source.indexOf(query);
    while (pos !== -1) {
      found.push(pos);
      pos = source.indexOf(query, pos + query.length);
    }

    setMatches(found);
    if (found.length > 0) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(-1);
    }
  }, [editor, searchTerm, caseSensitive]);

  if (!isOpen || !editor) return null;

  const navigateNext = () => {
    if (matches.length === 0) return;
    const next = (currentIndex + 1) % matches.length;
    setCurrentIndex(next);
  };

  const navigatePrev = () => {
    if (matches.length === 0) return;
    const prev = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prev);
  };

  const handleReplace = () => {
    if (!editor || !searchTerm || matches.length === 0) return;
    // Replace in editor document
    const html = editor.getHTML();
    const flags = caseSensitive ? "" : "i";
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, flags);
    const newHtml = html.replace(regex, replaceTerm);
    editor.commands.setContent(newHtml);
  };

  const handleReplaceAll = () => {
    if (!editor || !searchTerm || matches.length === 0) return;
    const html = editor.getHTML();
    const flags = caseSensitive ? "g" : "gi";
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, flags);
    const newHtml = html.replace(regex, replaceTerm);
    editor.commands.setContent(newHtml);
  };

  return (
    <div className="absolute top-3 right-4 z-40 w-80 sm:w-96 rounded-2xl border border-border bg-white p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 text-navy">
      {/* Search Input Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Find in document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.shiftKey) navigatePrev();
                else navigateNext();
              }
              if (e.key === "Escape") onClose();
            }}
            className="h-8 w-full rounded-lg border border-border bg-surface-raised pl-8 pr-16 text-xs text-navy focus:border-brand focus:outline-none"
          />
          {searchTerm && (
            <span className="absolute right-2 font-mono text-[10px] text-text-tertiary">
              {matches.length > 0 ? `${currentIndex + 1}/${matches.length}` : "0/0"}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={navigatePrev}
          disabled={matches.length === 0}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-raised disabled:opacity-30"
          title="Previous Match (Shift+Enter)"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={navigateNext}
          disabled={matches.length === 0}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-raised disabled:opacity-30"
          title="Next Match (Enter)"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setCaseSensitive(!caseSensitive)}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
            caseSensitive ? "bg-brand text-navy border-brand" : "border-border hover:bg-surface-raised text-text-tertiary"
          }`}
          title="Match Case"
        >
          <CaseSensitive className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-surface-raised hover:text-navy"
          title="Close (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Toggle Replace */}
      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowReplace(!showReplace)}
          className="text-[11px] font-bold text-brand hover:text-brand-hover inline-flex items-center gap-1"
        >
          <Replace className="h-3 w-3" /> {showReplace ? "Hide Replace" : "Show Replace"}
        </button>
      </div>

      {/* Replace Row */}
      {showReplace && (
        <div className="mt-2 space-y-2 animate-in fade-in duration-100">
          <div className="relative">
            <Replace className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              className="h-8 w-full rounded-lg border border-border bg-surface-raised pl-8 pr-3 text-xs text-navy focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={handleReplace}
              disabled={matches.length === 0}
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-surface-raised disabled:opacity-40"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleReplaceAll}
              disabled={matches.length === 0}
              className="rounded-lg bg-navy px-3 py-1 text-xs font-bold text-white hover:bg-navy-light disabled:opacity-40"
            >
              Replace All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
