import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
  Schema,
  DOMParser,
  Fragment,
  Slice,
  NodeRange
} from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import {
  addListNodes,
  liftListItem,
  sinkListItem
} from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";
import { keymap } from "prosemirror-keymap";
import "prosemirror-menu/../style/menu.css";
import { liftTarget, ReplaceAroundStep } from "prosemirror-transform";

// Mix the nodes from prosemirror-schema-list into the basic schema to
// create a schema with list support.
const mySchema = new Schema({
  nodes: addListNodes(
    schema.spec.nodes,
    // "paragraph (bullet_list | ordered_list)?",
    // "paragraph",
    "paragraph block*",
    "block"
  ),
  marks: schema.spec.marks
});

const myCoolOtherCommand = (state, dispatch) => {
  let { $cursor } = state.selection;

  if (!$cursor) {
    return false;
  }

  const atStartOfTextNode = $cursor.parentOffset === 0;
  const atStartOfParentNode = $cursor.index($cursor.depth - 1) === 0;
  if (!atStartOfTextNode || !atStartOfParentNode) {
    return false;
  }

  const parent = $cursor.node($cursor.depth - 2);

  const itemType = mySchema.nodes.list_item;

  if (
    parent.type.name !== "bullet_list" &&
    parent.type.name !== "ordered_list"
  ) {
    return false;
  }

  // if index > 0, we know we are not on first item of list
  const index = $cursor.index($cursor.depth - 2);

  if (
    index === 0 &&
    $cursor.node($cursor.depth - 3).type.name !== "list_item"
  ) {
    return false;
  }

  if (dispatch) {
    if (index === 0) {
      //prettier-ignore
      let {$from, $to} = state.selection
      //prettier-ignore
      let range = $from.blockRange($to, node => node.childCount && node.firstChild.type == itemType)
      //prettier-ignore
      let tr = state.tr, end = range.end, endOfList = range.$to.end(range.depth)
      //prettier-ignore
      if (end < endOfList) {
        // There are siblings after the lifted items, which must become
        // children of the last item
        tr.step(new ReplaceAroundStep(end - 1, endOfList, end, endOfList,
                                      new Slice(Fragment.from(itemType.create(null, range.parent.copy())), 1, 0), 1, true))
        range = new NodeRange(tr.doc.resolve(range.$from.pos), tr.doc.resolve(endOfList), range.depth)
      }

      tr = tr.lift(range, liftTarget(range));
      tr = tr.join(tr.mapping.map($cursor.pos - 2));
      tr = tr.join(tr.mapping.map($cursor.pos - 2));
      tr = tr.scrollIntoView();
      dispatch(tr);

      return true;
    } else {
      const previousSibling = parent.child(index - 1);
      if (
        previousSibling.lastChild.type.name === "bullet_list" ||
        previousSibling.lastChild.type.name === "ordered_list"
      ) {
        sinkListItem(mySchema.nodes.list_item)(state, dispatch);
        return true;
      } else {
        let tr = state.tr;
        tr = tr.join($cursor.pos - 2);
        tr = tr.join(tr.mapping.map($cursor.pos - 2));
        dispatch(tr);
        return true;
      }
    }
  }

  return false;
};

let backspace = myCoolOtherCommand;

let myCoolKeymap = {
  Backspace: backspace
};

myCoolKeymap = keymap(myCoolKeymap);

window.view = new EditorView(document.querySelector("#editor"), {
  state: EditorState.create({
    doc: DOMParser.fromSchema(mySchema).parse(
      document.querySelector("#content")
    ),
    plugins: []
      .concat([myCoolKeymap])
      .concat(exampleSetup({ schema: mySchema }))
  })
});
