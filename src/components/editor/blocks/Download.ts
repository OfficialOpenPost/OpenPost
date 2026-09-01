import { Node, mergeAttributes } from "@tiptap/core";

export const DownloadBlock = Node.create({
  name: "downloadBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      fileName: { default: "file.pdf" },
      fileSize: { default: "1.2 MB" },
      url: { default: "#" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="downloadBlock"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "downloadBlock", class: "my-6 flex items-center gap-4 rounded-xl border border-border bg-surface-raised p-4" }),
      ["div", { class: "flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand" }, "⬇"],
      ["div", {}, ["div", { class: "text-sm font-bold text-navy" }, node.attrs.fileName], ["div", { class: "text-xs text-text-tertiary" }, node.attrs.fileSize]],
      ["a", { href: node.attrs.url, class: "ml-auto rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white" }, "Download"],
    ];
  },

  addCommands() {
    return {
      setDownload:
        (attrs: Record<string, unknown>) =>
        ({ commands }: any) =>
          commands.insertContent({ type: this.name, attrs }),
    } as any;
  },
});
