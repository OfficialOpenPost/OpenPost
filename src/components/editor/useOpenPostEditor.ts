"use client";

import { useEditor } from "@tiptap/react";
import { editorExtensions } from "./extensions";

interface UseOpenPostEditorOptions {
  content?: string;
  onChange?: (html: string, json: Record<string, unknown>) => void;
  editable?: boolean;
}

export function useOpenPostEditor({ content = "", onChange, editable = true }: UseOpenPostEditorOptions = {}) {
  return useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: content || "<p></p>",
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML(), editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "tiptap min-h-[480px] px-8 py-8 md:px-12 focus:outline-none",
      },
    },
  });
}
