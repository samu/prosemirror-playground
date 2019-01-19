import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";
import { keymap } from "prosemirror-keymap";
import "prosemirror-menu/../style/menu.css";

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

const myCoolCommand = (state, dispatch) => {
  let { $cursor } = state.selection;

  if (!$cursor) {
    return false;
  }

  if ($cursor.parentOffset === 0 && $cursor.index($cursor.depth - 1) === 0) {
    if ($cursor.node($cursor.depth - 1).type.name === "list_item") {
      if (dispatch) {
        let tr = state.tr;
        tr = tr.join($cursor.pos - 2);
        tr = tr.join(tr.mapping.map($cursor.pos - 2));
        tr = tr.scrollIntoView();

        dispatch(tr);
      }

      return true;
    }
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
