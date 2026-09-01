import { Node, mergeAttributes } from "@tiptap/core";

export const PollBlock = Node.create({
  name: "pollBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      pollId: { default: null },
      question: { default: "What do you think?" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="pollBlock"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "pollBlock", class: "my-6 rounded-xl border border-border bg-white p-6" }),
      ["div", { class: "text-sm font-bold text-navy" }, node.attrs.question || "Poll"],
      ["div", { class: "mt-3 text-xs text-text-tertiary" }, "Poll — vote via POST /api/v1/polls/:id/vote (fingerprint dedup)"],
    ];
  },

  addCommands() {
    return {
      setPoll:
        (attrs: Record<string, unknown>) =>
        ({ commands }: any) =>
          commands.insertContent({ type: this.name, attrs }),
    } as any;
  },
});
