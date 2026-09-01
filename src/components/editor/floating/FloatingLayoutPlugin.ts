import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";

/**
 * FloatingLayoutPlugin — Simplified
 *
 * Instead of complex sentinel + absolute positioning, this plugin
 * directly applies CSS `float` to the Tiptap NodeView wrapper element.
 *
 * CSS float on a block-level element DOES create genuine per-line text
 * reflow in subsequent elements — the browser's line-breaking algorithm
 * shortens each text line that shares vertical space with the float.
 *
 * The key is ensuring that sibling text blocks (paragraphs, headings)
 * don't have `overflow: hidden` or `clear: both` which would create
 * a new block formatting context and prevent float wrapping.
 */

export const FLOATING_LAYOUT_KEY = new PluginKey("floatingLayout");

interface FloatInfo {
  pos: number;
  node: PMNode;
  float: "left" | "right";
  width: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
}

/** Collect all floatingImage nodes that should float. */
function collectFloats(doc: PMNode): FloatInfo[] {
  const floats: FloatInfo[] = [];
  doc.forEach((node, offset) => {
    if (node.type.name === "floatingImage") {
      const a = node.attrs;
      const effectiveFloat =
        a.float === "left" || a.layout === "left"
          ? "left"
          : a.float === "right" || a.layout === "right"
          ? "right"
          : null;

      if (effectiveFloat) {
        floats.push({
          pos: offset,
          node,
          float: effectiveFloat,
          width: typeof a.width === "number" ? a.width : parseInt(a.width) || 400,
          marginTop: a.marginTop ?? 8,
          marginRight: a.marginRight ?? 16,
          marginBottom: a.marginBottom ?? 8,
          marginLeft: a.marginLeft ?? 16,
        });
      }
    }
  });
  return floats;
}

/**
 * Find the NodeView wrapper DOM element for a given document position.
 */
function findNodeViewWrapper(view: EditorView, pos: number): HTMLElement | null {
  try {
    const domNode = view.nodeDOM(pos);
    if (!domNode) return null;
    const el = domNode instanceof HTMLElement ? domNode : (domNode as any).parentElement;
    if (!el) return null;
    // Walk up to find the data-node-view-wrapper
    let node: HTMLElement | null = el;
    while (node && !node.hasAttribute("data-node-view-wrapper")) {
      node = node.parentElement;
    }
    return node;
  } catch {
    return null;
  }
}

/**
 * Apply float styles directly to the NodeView wrapper.
 */
function applyFloatToWrapper(wrapper: HTMLElement, info: FloatInfo) {
  Object.assign(wrapper.style, {
    float: info.float,
    clear: info.float,         // clear same side to prevent stacking
    width: `${info.width}px`,
    maxWidth: "50%",           // never wider than half the editor
    margin: `${info.marginTop}px ${info.marginRight}px ${info.marginBottom}px ${info.marginLeft}px`,
    position: "relative",      // not absolute — stay in flow
    zIndex: "5",
    display: "block",
    overflow: "visible",
  });
  wrapper.setAttribute("data-fi-floating", info.float);
}

/**
 * Remove float styles from a NodeView wrapper.
 */
function removeFloatFromWrapper(wrapper: HTMLElement) {
  if (!wrapper.hasAttribute("data-fi-floating")) return;
  wrapper.removeAttribute("data-fi-floating");
  wrapper.style.float = "";
  wrapper.style.clear = "";
  wrapper.style.width = "";
  wrapper.style.maxWidth = "";
  wrapper.style.margin = "";
  wrapper.style.position = "";
  wrapper.style.zIndex = "";
  wrapper.style.display = "";
  wrapper.style.overflow = "";
}

/**
 * The core plugin: on every update, scan for floats and apply CSS float
 * to their NodeView wrappers. Non-floating images get their float styles
 * removed.
 */
export function floatingLayoutPlugin(): Plugin {
  let prevFloatPositions = new Set<number>();

  function performLayout(view: EditorView) {
    if (!view.dom) return;

    const floats = collectFloats(view.state.doc);
    const currentPositions = new Set<number>();

    // Apply float to floating images
    for (const info of floats) {
      currentPositions.add(info.pos);
      const wrapper = findNodeViewWrapper(view, info.pos);
      if (wrapper) {
        applyFloatToWrapper(wrapper, info);
      }
    }

    // Remove float from wrappers that are no longer floating
    // (check the editor DOM for any wrappers with our attribute)
    const editorDom = view.dom as HTMLElement;
    const allFloated = editorDom.querySelectorAll("[data-fi-floating]");
    allFloated.forEach((el) => {
      const htmlEl = el as HTMLElement;
      // Check if this is still in our float set by seeing if it's a wrapper
      // for any of the current float positions
      let stillFloat = false;
      for (const info of floats) {
        const wrapper = findNodeViewWrapper(view, info.pos);
        if (wrapper === htmlEl) {
          stillFloat = true;
          break;
        }
      }
      if (!stillFloat) {
        removeFloatFromWrapper(htmlEl);
      }
    });

    prevFloatPositions = currentPositions;
  }

  return new Plugin({
    key: FLOATING_LAYOUT_KEY,

    view() {
      return {
        update(view) {
          // Defer to after Tiptap has rendered the NodeViews
          requestAnimationFrame(() => performLayout(view));
        },
        destroy() {
          // nothing to clean up
        },
      };
    },
  });
}
