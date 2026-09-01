import { Node, mergeAttributes } from "@tiptap/core";

export const ButtonBlock = Node.create({
  name: "buttonBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      label: { default: "Click me" },
      url: { default: "#" },
      variant: { default: "primary" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="buttonBlock"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const variant = node.attrs.variant ?? "primary";
    const cls = variant === "primary" ? "bg-brand text-navy" : variant === "secondary" ? "bg-navy text-white" : "border border-navy text-navy bg-surface";
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "buttonBlock", class: "my-6 text-center" }),
      ["a", { href: node.attrs.url, class: `inline-flex rounded-xl px-6 py-3 text-sm font-bold ${cls}` }, node.attrs.label],
    ];
  },

  addCommands() {
    return {
      setButton:
        (attrs: Record<string, unknown>) =>
        ({ commands }: any) =>
          commands.insertContent({ type: this.name, attrs }),
    } as any;
  },
});
