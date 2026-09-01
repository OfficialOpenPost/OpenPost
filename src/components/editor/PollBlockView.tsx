"use client";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { GripVertical, Plus, Trash2, BarChart3 } from "lucide-react";
import { useState } from "react";

export function PollBlockView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { question, options: rawOptions, type = "single", pollId } = node.attrs;
  const [options, setOptions] = useState<Array<{ id: string; label: string }>>(rawOptions ?? [
    { id: "1", label: "Option A" },
    { id: "2", label: "Option B" },
  ]);

  const sync = (next: typeof options, q = question) => {
    setOptions(next);
    updateAttributes({ options: next, question: q, type, pollId: pollId ?? `poll-${Date.now()}` });
  };

  const add = () => sync([...options, { id: Date.now().toString(), label: `Option ${options.length + 1}` }]);
  const remove = (id: string) => sync(options.filter(o => o.id !== id));
  const move = (from: number, to: number) => {
    const arr = [...options];
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    sync(arr);
  };

  return (
    <NodeViewWrapper className="my-6">
      <div className={`rounded-xl border bg-white p-4 ${selected ? "border-brand ring-2 ring-brand/20" : "border-border"}`}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <BarChart3 className="h-4 w-4" />
          </div>
          <input
            value={question}
            onChange={e => sync(options, e.target.value)}
            placeholder="Poll question"
            className="flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm font-semibold focus:border-brand focus:outline-none"
          />
          <button onClick={() => deleteNode()} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-flame/10 text-flame">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {options.map((opt, idx) => (
            <div key={opt.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-2 py-1.5">
              <button
                draggable
                onDragStart={e => e.dataTransfer.setData("text/plain", String(idx))}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
                  if (!isNaN(from)) move(from, idx);
                }}
                className="cursor-grab active:cursor-grabbing p-1"
                title="Drag to reorder"
              >
                <GripVertical className="h-4 w-4 text-text-tertiary" />
              </button>
              <span className="text-xs font-bold text-text-tertiary w-6">{idx + 1}.</span>
              <input
                value={opt.label}
                onChange={e => {
                  const next = [...options];
                  next[idx] = { ...opt, label: e.target.value };
                  sync(next);
                }}
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
              <button onClick={() => remove(opt.id)} className="text-text-tertiary hover:text-flame">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button onClick={add} className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-surface-raised">
            <Plus className="h-3 w-3" /> Add option
          </button>
          <span className="text-xs text-text-tertiary">{type === "single" ? "Single choice" : "Multiple"} · drag to reorder</span>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
