import { openLocalStudioForm } from "../local-studio-form";
import {
  initializedEmptyLink,
  splitLinkEditorDocument,
  splitLinkEditorTypes,
} from "@/tests/fixtures/split-link-editor";
import "./style.css";

const params = new URLSearchParams(location.search);
const fixture = params.get("fixture") || "new";
const readOnly = params.has("readonly");
await openLocalStudioForm({
  types: splitLinkEditorTypes,
  schemaName: "splitLinkEditor",
  title: "Split Column · local form",
  label: "Link editor",
  storageKey: `split-editor-${fixture}-${readOnly}`,
  readOnly,
  document(initial) {
    const document = splitLinkEditorDocument(initial);
    if (fixture !== "new")
      document.link = {
        ...initializedEmptyLink,
        ...(fixture === "complete"
          ? { title: "Ver más", href: "/features" }
          : {}),
      };
    return document;
  },
  components: {
    field: (props) =>
      props.path.length === 1 &&
      (params.has("controls")
        ? ["image", "body"].includes(props.name)
        : props.name !== "link")
        ? null
        : props.renderDefault(props),
  },
});
