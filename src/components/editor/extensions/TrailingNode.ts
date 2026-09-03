import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/**
 * TrailingNode ensures that there is ALWAYS a paragraph at the end of the document,
 * allowing users to click and write below tables, images, code blocks, or embeds.
 */
export const TrailingNode = Extension.create({
  name: "trailingNode",
  addProseMirrorPlugins() {
    const plugin = new PluginKey(this.name);
    const disabledNodes = ["paragraph"];

    return [
      new Plugin({
        key: plugin,
        appendTransaction: (_, __, state) => {
          const { doc, tr, schema } = state;
          const shouldInsertNodeAtEnd = !disabledNodes.includes(doc.lastChild?.type.name ?? "");

          if (shouldInsertNodeAtEnd) {
            const type = schema.nodes.paragraph;
            if (!type) return null;
            return tr.insert(doc.content.size, type.create());
          }

          return null;
        },
      }),
    ];
  },
});
