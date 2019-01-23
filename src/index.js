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

import { eagerJoinBackward, eagerJoinForward } from "prosemirror-eager-join";

const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
  marks: schema.spec.marks
});

const listTypes = [mySchema.nodes.bullet_list, mySchema.nodes.ordered_list];
const itemTypes = [mySchema.nodes.list_item];

let backspace = eagerJoinBackward(itemTypes, listTypes);
let del = eagerJoinForward(itemTypes, listTypes);

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
