import { defineField } from "sanity";

export const heroLayoutField = defineField({
  name: "layout",
  title: "Layout",
  type: "string",
  initialValue: "horizontal",
  options: {
    layout: "radio",
    direction: "horizontal",
    list: [
      { title: "Side by side", value: "horizontal" },
      { title: "Text above", value: "vertical" },
    ],
  },
});
