import { Selection as PMSelection } from "prosemirror-state";
import { Selection as TiptapSelection } from "@tiptap/pm/state";

function patchSelection(SelectionObj: any) {
  if (SelectionObj && typeof SelectionObj.jsonID === "function" && !SelectionObj.__isPatched) {
    const originalJsonID = SelectionObj.jsonID;
    SelectionObj.jsonID = function (id: string, constructor: any) {
      try {
        return originalJsonID.call(SelectionObj, id, constructor);
      } catch (err: any) {
        if (
          err instanceof RangeError &&
          err.message &&
          err.message.includes("Duplicate use of selection JSON ID")
        ) {
          return constructor;
        }
        throw err;
      }
    };
    SelectionObj.__isPatched = true;
  }
}

patchSelection(PMSelection);
patchSelection(TiptapSelection);
