import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { PollBlockView } from "../PollBlockView";

export const PollBlock = Node.create({
  name: "pollBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      pollId: { default: null },
      question: { default: "What do you think?" },
      description: { default: "" },
      options: { default: [{ id: "1", label: "Option A" }, { id: "2", label: "Option B" }] },
      type: { default: "single" },
      showResults: { default: "always" },
      allowAnonymous: { default: true },
      closesAt: { default: null },
      align: { default: "center" },
      layout: { default: "center" },
      width: { default: "100%" },
      status: { default: "open" },
      themeColor: { default: "#FEA611" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="pollBlock"]' }, { tag: 'div[data-type="poll"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const borderColor = node.attrs.themeColor || "#FEA611";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "pollBlock",
        class: "my-6 rounded-none bg-white p-6",
        style: `border: 2px solid ${borderColor}`,
      }),
      ["div", { class: "text-sm font-bold text-navy" }, node.attrs.question || "Poll"],
      ["div", { class: "mt-3 text-xs text-text-tertiary" }, `Poll — ${node.attrs.options?.length ?? 2} options`],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PollBlockView);
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
