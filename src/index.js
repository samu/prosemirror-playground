import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser, Fragment, Slice } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
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

// prettier-ignore
function sinkListItem(itemType) {
  return function(tr, $pos) {
    let range = $pos.blockRange($pos, node => node.childCount && node.firstChild.type == itemType)
    if (!range) return false
    let startIndex = range.startIndex
    if (startIndex == 0) return false
    let parent = range.parent, nodeBefore = parent.child(startIndex - 1)
    if (nodeBefore.type != itemType) return false

    let nestedBefore = nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type
    let inner = Fragment.from(nestedBefore ? itemType.create() : null)
    let slice = new Slice(Fragment.from(itemType.create(null, Fragment.from(parent.copy(inner)))),
                          nestedBefore ? 3 : 1, 0)
    let before = range.start, after = range.end
    return tr.step(new ReplaceAroundStep(before - (nestedBefore ? 3 : 1), after,
                                                 before, after, slice, 1, true))
  }
}

const sinker = sinkListItem(mySchema.nodes.list_item);

const myCoolCommand = (state, dispatch) => {
  let { $cursor } = state.selection;

  if (!$cursor) {
    return false;
  }

  const atStartOfTextNode = $cursor.parentOffset === 0;

  const insideListNode =
    $cursor.node($cursor.depth - 1).type.name === "list_item";

  const atStartOfParentNode = $cursor.index($cursor.depth - 1) === 0;

  const insideFirstItemOfList = $cursor.index($cursor.depth - 2) === 0;

  if (atStartOfTextNode && atStartOfParentNode && insideListNode) {
    if (dispatch) {
      const insideAnotherList =
        $cursor.node($cursor.depth - 3).type.name === "list_item";

      let tr = state.tr;

      if (insideFirstItemOfList && insideAnotherList) {
        let range = $cursor.blockRange();
        let target = range && liftTarget(range);
        tr = state.tr.lift(range, target);
        tr = tr.join(tr.mapping.map($cursor.pos - 2));
      } else {
        tr = tr.join(tr.mapping.map($cursor.pos - 2));
        tr = tr.join(tr.mapping.map($cursor.pos - 2));

        // let newState;
        //
        // tr = sinker(tr, $cursor);
        //
        // newState = state.apply(tr);
        // tr = sinker(tr, newState.doc.resolve(tr.mapping.map($cursor.pos)));
        //
        // tr = tr.join(tr.mapping.map($cursor.pos - 2));
        // tr = tr.join(tr.mapping.map($cursor.pos - 2));
      }

      tr = tr.scrollIntoView();

      dispatch(tr);
    }

    return true;
  }

  return false;
};

let backspace = myCoolCommand;

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
