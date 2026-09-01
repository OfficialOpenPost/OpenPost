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
      const html = editor.getHTML();
      const json = editor.getJSON();
      // Use queueMicrotask to avoid flushSync warnings in React 19
      queueMicrotask(() => {
        onChange?.(html, json);
      });
    },
    editorProps: {
      attributes: {
        class: "tiptap min-h-[480px] px-8 py-8 md:px-12 focus:outline-none",
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length && files[0].type.startsWith("image/")) {
          event.preventDefault();
          (async () => {
            try {
              const { uploadImageWithWebP } = await import("@/lib/uploadMedia");
              for (const f of Array.from(files)) {
                const { url } = await uploadImageWithWebP(f as File);
                const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.from;
                view.dispatch(view.state.tr.insert(pos, view.state.schema.nodes.image.create({ src: url })));
              }
            } catch {}
          })();
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (!file) continue;
            event.preventDefault();
            (async () => {
              try {
                const { uploadImageWithWebP } = await import("@/lib/uploadMedia");
                const { url } = await uploadImageWithWebP(file);
                const { state, dispatch } = view;
                dispatch(state.tr.replaceSelectionWith(state.schema.nodes.image.create({ src: url })));
              } catch {}
            })();
            return true;
          }
        }
        return false;
      },
    },
  });
}
