import { EditorState, Selection } from "prosemirror-state";
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

  return myCoolOtherCommandMain(state, dispatch, state.tr, $cursor);
};

const myCoolOtherCommandMain = (state, dispatch, tr, $cursor) => {
  const index = $cursor.index($cursor.depth - 2);
  const parent = $cursor.node($cursor.depth - 2);
  const itemType = mySchema.nodes.list_item;

  if (dispatch) {
    if (index === 0) {
      //prettier-ignore
      let $from = $cursor, $to = $cursor
      //prettier-ignore
      let range = $from.blockRange($to, node => node.childCount && node.firstChild.type == itemType)
      //prettier-ignore
      let end = range.end, endOfList = range.$to.end(range.depth)
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

// prettier-ignore
function findCutAfter($pos) {
  if (!$pos.parent.type.spec.isolating) for (let i = $pos.depth - 1; i >= 0; i--) {
    let parent = $pos.node(i)
    if ($pos.index(i) + 1 < parent.childCount) return $pos.doc.resolve($pos.after(i + 1))
    if (parent.type.spec.isolating) break
  }
  return null
}

const myCoolDelete = (state, dispatch) => {
  let { $cursor } = state.selection;

  const atEndOfTextNode = $cursor.parentOffset === $cursor.parent.nodeSize - 2;

  const insideListItem = $cursor.node(-1).type.name === "list_item";

  if (!atEndOfTextNode || !insideListItem) {
    return false;
  }

  const listItemNode = $cursor.node(-1);

  // case: Three
  const isSecondLastAndFollowedByList =
    $cursor.index(-1) === listItemNode.childCount - 2 &&
    (listItemNode.child(listItemNode.childCount - 1).type.name ===
      "bullet_list" ||
      listItemNode.child(listItemNode.childCount - 1).type.name ===
        "ordered_list");

  const listNode = $cursor.node(-2);

  // case: Four
  const isFollowedByListItem =
    listNode.childCount > $cursor.index(-2) + 1 &&
    listNode.child($cursor.index(-2) + 1).type.name === "list_item";

  let $cut = findCutAfter($cursor);

  if (!$cut) return false;

  // case: Six
  const nodeAfterIsListItem = $cut.nodeAfter.type.name === "list_item";

  if (
    !isSecondLastAndFollowedByList &&
    !isFollowedByListItem &&
    !nodeAfterIsListItem
  ) {
    return false;
  }

  const offset = isSecondLastAndFollowedByList ? 3 : 2;

  const $pos = state.doc.resolve($cut.pos + offset);

  let tr = state.tr;
  tr = tr.setSelection(Selection.near($pos));
  state = state.apply(tr);

  return myCoolOtherCommandMain(state, dispatch, tr, $pos);
};

let del = myCoolDelete;

let myCoolKeymap = {
  Backspace: backspace,
  Delete: del
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
