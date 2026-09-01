import { Node, mergeAttributes } from "@tiptap/core";

export const Accordion = Node.create({
  name: "accordion",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      items: {
        default: [
          { title: "Section 1", content: "Content for section 1..." },
          { title: "Section 2", content: "Content for section 2..." },
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
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="accordion"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const items = (node.attrs.items as Array<{ title: string; content: string }>) ?? [];
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "accordion", class: "my-6 rounded-xl border border-border bg-surface overflow-hidden divide-y divide-border" }),
      ...items.map((it: any, idx: number) => [
        "div",
        { class: "p-4", "data-idx": String(idx) },
        ["div", { class: "font-bold text-navy" }, it.title || `Section ${idx + 1}`],
        ["div", { class: "mt-2 text-sm text-text-secondary" }, it.content || ""],
      ]),
    ];
  },

  addCommands() {
    return {
      setAccordion:
        (attrs: Record<string, unknown>) =>
        ({ commands }: any) =>
          commands.insertContent({ type: this.name, attrs }),
      updateAccordion:
        (attrs: Record<string, unknown>) =>
        ({ commands }: any) =>
          commands.updateAttributes(this.name, attrs),
    } as any;
  },
});
