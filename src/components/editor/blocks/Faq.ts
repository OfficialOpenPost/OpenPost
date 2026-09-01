import { Node, mergeAttributes } from "@tiptap/core";

export const Faq = Node.create({
  name: "faq",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      items: {
        default: [
          { question: "What is OpenPost?", answer: "OpenPost is a headless CMS for blogs." },
          { question: "How do I use it?", answer: "Create posts in the editor and publish via API." },
        ],
        parseHTML: (el) => {
          try {
            const raw = el.getAttribute("data-items");
            return raw ? JSON.parse(raw) : undefined;
          } catch {
            return undefined;
          }
        },
        renderHTML: (attrs) => ({ "data-items": JSON.stringify(attrs.items) }),
      },
      // Legacy single question support (migrated to items[0])
      question: { default: null, parseHTML: (el) => el.getAttribute("data-question"), renderHTML: (attrs) => (attrs.question ? { "data-question": attrs.question } : {}) },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="faq"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    // Migrate legacy question -> items
    let items = (node.attrs.items as Array<{ question: string; answer: string }>) ?? [];
    if (!items.length && node.attrs.question) {
      items = [{ question: node.attrs.question, answer: "Answer..." }];
    }
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "faq", class: "my-6 rounded-xl border border-border bg-surface overflow-hidden" }),
      ["div", { class: "bg-navy px-4 py-3 text-sm font-bold text-white" }, "FAQ"],
      ...items.map((it: any, idx: number) => [
        "div",
        { class: "border-t border-border p-4 first:border-0", "data-idx": String(idx) },
        ["div", { class: "font-semibold text-navy" }, it.question || `Question ${idx + 1}`],
        ["div", { class: "mt-2 text-sm text-text-secondary" }, it.answer || ""],
      ]),
    ];
  },

  addCommands() {
    return {
      setFaq:
        (attrs: Record<string, unknown>) =>
        ({ commands }: any) => {
          // Ensure min items and valid shape
          const items = (attrs as any).items;
          if (Array.isArray(items) && items.length === 0) (attrs as any).items = [{ question: "Question?", answer: "Answer..." }];
          return commands.insertContent({ type: this.name, attrs });
        },
      updateFaq:
        (attrs: Record<string, unknown>) =>
        ({ commands }: any) =>
          commands.updateAttributes(this.name, attrs),
    } as any;
  },
});
