"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { editorExtensions, EDITOR_STYLES } from "./extensions";
import { SelectionBubbleMenu, ImageBubbleMenu } from "./BubbleMenus";

interface OpenPostEditorProps {
  content?: string;
  onChange?: (html: string, json: Record<string, unknown>) => void;
  editable?: boolean;
  placeholder?: string;
  editor?: Editor | null;
}

export function OpenPostEditor({ content = "", onChange, editable = true, editor: externalEditor }: OpenPostEditorProps) {
  const internalEditor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: content || "<p></p>",
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      onChange?.(html, json);
    },
    editorProps: {
      attributes: {
        class: "tiptap min-h-[480px] px-8 py-8 md:px-12 focus:outline-none",
      },
    },
  });

  const editor = externalEditor ?? internalEditor;

  if (!editor) return null;

  return (
    <>
      <style>{EDITOR_STYLES}</style>
      <div className="w-full bg-surface">
        <div className="mx-auto max-w-[900px]">
          <SelectionBubbleMenu editor={editor} />
          <ImageBubbleMenu editor={editor} />
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  );
}

export type { OpenPostEditorProps };
