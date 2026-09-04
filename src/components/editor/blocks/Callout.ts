import { Node, mergeAttributes } from "@tiptap/core";

export interface CalloutOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { tone?: string }) => ReturnType;
      toggleCallout: (attrs?: { tone?: string }) => ReturnType;
    };
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      tone: {
        default: "info",
        parseHTML: (el) => el.getAttribute("data-tone") || "info",
        renderHTML: (attrs) => ({ "data-tone": attrs.tone }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="callout"]' },
      { tag: 'blockquote[data-type="callout"]' },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const tone = node.attrs.tone ?? "info";
    const toneClasses: Record<string, string> = {
      tip: "border-l-4 border-amber-500 bg-amber-50/80 text-slate-800 shadow-2xs",
      info: "border-l-4 border-blue-500 bg-blue-50/80 text-slate-800 shadow-2xs",
      warning: "border-l-4 border-amber-600 bg-amber-50/90 text-slate-900 shadow-2xs",
      success: "border-l-4 border-emerald-500 bg-emerald-50/80 text-slate-800 shadow-2xs",
      note: "border-l-4 border-slate-700 bg-slate-100 text-slate-800 shadow-2xs",
    };
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "callout",
        "data-tone": tone,
        class: `my-6 rounded-2xl p-5 border border-slate-200/60 leading-relaxed text-sm sm:text-base font-medium ${toneClasses[tone] ?? toneClasses.info}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attrs) =>
        ({ commands }) =>
          commands.wrapIn(this.name, attrs),
      toggleCallout:
        (attrs) =>
        ({ chain }) =>
          chain().toggleWrap(this.name, attrs).run(),
    };
  },
});
