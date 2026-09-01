import { Node, mergeAttributes } from "@tiptap/core";

export const Faq = Node.create({
  name: "faq",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      question: { default: "Question?" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="faq"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "faq", class: "my-6 rounded-xl border border-border bg-surface overflow-hidden" }),
      ["div", { class: "bg-navy px-4 py-3 text-sm font-bold text-white" }, node.attrs.question || "FAQ"],
      ["div", { class: "p-4" }, 0],
    ];
  },

  addCommands() {
    return {
      setFaq:
        (attrs: Record<string, unknown>) =>
        ({ commands }: any) =>
          commands.insertContent({ type: this.name, attrs, content: [{ type: "paragraph", content: [{ type: "text", text: "Answer..." }] }] }),
    } as any;
  },
});
