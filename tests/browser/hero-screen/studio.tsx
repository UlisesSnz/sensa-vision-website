import { ObjectInput, set, type ImageInputProps } from "sanity";
import hero from "@/sanity/schemas/blocks/hero/hero-2";
import link from "@/sanity/schemas/blocks/shared/link";
import { buttonVariant } from "@/sanity/schemas/blocks/shared/button-variant";
import { templates } from "@/tests/fixtures/hero-screen";
import { openLocalStudioForm } from "../local-studio-form";
import "../split-editor/style.css";

function LocalImage(props: ImageInputProps) {
  // Substitute the remote asset picker only. Studio renders the slide's real fields.
  return (
    <>
      <label>
        Test image{" "}
        <select
          value={props.value?.asset?._ref ?? ""}
          onChange={(event) =>
            props.onChange(
              set({ _type: "reference", _ref: event.target.value }, ["asset"]),
            )
          }
        >
          <option value="" disabled>
            Select an image
          </option>
          {templates.map((asset) => (
            <option key={asset._id} value={asset._id}>
              {asset.alt}
            </option>
          ))}
        </select>
      </label>
      <ObjectInput
        {...props}
        members={props.members.filter(
          (member) =>
            member.kind === "field" && ["alt", "scene"].includes(member.name),
        )}
      />
    </>
  );
}

await openLocalStudioForm({
  types: [
    link,
    buttonVariant,
    { name: "block-content", type: "array", of: [{ type: "block" }] },
    { name: "heroScreenEditor", type: "document", fields: hero.fields },
  ],
  schemaName: "heroScreenEditor",
  title: "Template Screen · Local Studio",
  label: "Hero templates",
  storageKey: "hero-screen-document",
  document: (initial) => ({
    ...initial,
    _id: "local-hero",
    _type: "heroScreenEditor",
    _rev: "fixture",
    _createdAt: "2026-11-02T00:00:00Z",
    _updatedAt: "2026-11-02T00:00:00Z",
    title: "Plantillas de la farmacia",
  }),
  components: {
    field: (props) =>
      props.path.length === 1 && !["slides", "baseScene"].includes(props.name)
        ? null
        : props.renderDefault(props),
    input: (props) =>
      props.schemaType.name === "slide" ? (
        <LocalImage {...(props as ImageInputProps)} />
      ) : (
        props.renderDefault(props)
      ),
  },
});
