"use client";

import { useEditor } from "@tiptap/react";
import { editorExtensions } from "./extensions";

// Suppress benign @tiptap/react ReactRenderer flushSync lifecycle dev noise in React 18/19
if (typeof window !== "undefined") {
  const origError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("flushSync was called from inside a lifecycle method")
    ) {
      return;
    }
    origError.apply(console, args);
  };
}

interface UseOpenPostEditorOptions {
  content?: any;
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
      // Use queueMicrotask to avoid React flushSync warning in React 19
      queueMicrotask(() => {
        onChange?.(html, json);
      });
    },
    editorProps: {
      attributes: {
        class: "tiptap min-h-[520px] focus:outline-none",
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length) {
          const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
          if (imageFiles.length > 0) {
            event.preventDefault();
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            const targetPos = coordinates?.pos ?? view.state.selection.from;

            for (const file of imageFiles) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                if (!dataUrl) return;

                const node = view.state.schema.nodes.image?.create({
                  src: dataUrl,
                  width: 380,
                  layout: "center",
                  float: "none",
                });
                if (node) {
                  view.dispatch(view.state.tr.insert(targetPos, node).scrollIntoView());
                }

                // Background upload to persist real URL
                (async () => {
                  try {
                    const { uploadImageWithWebP } = await import("@/lib/uploadMedia");
                    const { url } = await uploadImageWithWebP(file);
                    view.state.doc.descendants((n, p) => {
                      if (n.type.name === "image" && n.attrs.src === dataUrl) {
                        view.dispatch(view.state.tr.setNodeMarkup(p, undefined, { ...n.attrs, src: url }));
                        return false;
                      }
                    });
                  } catch (err) {
                    console.error("Drop background upload error:", err);
                  }
                })();
              };
              reader.readAsDataURL(file);
            }
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const clipboard = event.clipboardData;
        if (!clipboard) return false;

        // 1. Check for pasted image files / screenshot bitmaps
        const items = Array.from(clipboard.items || []);
        const imageItem = items.find((it) => it.type.startsWith("image/"));
        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              if (!dataUrl) return;

              const node = view.state.schema.nodes.image?.create({
                src: dataUrl,
                width: 380,
                layout: "center",
                float: "none",
              });
              if (node) {
                view.dispatch(view.state.tr.replaceSelectionWith(node).scrollIntoView());
              }

              // Background upload to persist permanent URL
              (async () => {
                try {
                  const { uploadImageWithWebP } = await import("@/lib/uploadMedia");
                  const { url } = await uploadImageWithWebP(file);
                  view.state.doc.descendants((n, pos) => {
                    if (n.type.name === "image" && n.attrs.src === dataUrl) {
                      view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { ...n.attrs, src: url }));
                      return false;
                    }
                  });
                } catch (err) {
                  console.error("Paste image upload background error:", err);
                }
              })();
            };
            reader.readAsDataURL(file);
            return true;
          }
        }

        // 2. Check for pasted direct image URL or DataURL in plain text
        const text = clipboard.getData("text/plain")?.trim();
        if (text && (/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(text) || text.startsWith("data:image/"))) {
          event.preventDefault();
          const node = view.state.schema.nodes.image?.create({
            src: text,
            width: 380,
            layout: "center",
            float: "none",
          });
          if (node) {
            view.dispatch(view.state.tr.replaceSelectionWith(node).scrollIntoView());
            return true;
          }
        }

        return false;
      },
    },
  });
}
