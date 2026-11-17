import { defineField } from "sanity";
import HeroLayoutInput from "@/sanity/components/hero-layout-input";
import { HERO_LAYOUTS, SECTION_WIDTH } from "../shared/layout-variants";

export const heroLayoutField = defineField({
  name: "layout",
  title: "Layout",
  type: "string",
  initialValue: HERO_LAYOUTS[0].value,
  options: { list: HERO_LAYOUTS },
  components: { input: HeroLayoutInput },
});

export const heroContentWidthField = defineField({
  name: "contentWidth",
  title: "Text width",
  type: "string",
  description: "Choose how wide the text appears above the media.",
  initialValue: "default",
  options: { layout: "radio", list: SECTION_WIDTH },
  hidden: ({ parent }) => parent?.layout !== "vertical",
});
