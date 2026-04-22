import { defineField, defineType } from "sanity";
import { Sparkles } from "lucide-react";

const TEXT_POSITIONS = [
  { title: "Left", value: "left" },
  { title: "Right", value: "right" },
  { title: "Center", value: "center" },
  { title: "Top", value: "top" },
  { title: "Bottom", value: "bottom" },
];

const LOTTIE_SIZES = [
  { title: "Small (200px)", value: "sm" },
  { title: "Medium (400px)", value: "md" },
  { title: "Large (600px)", value: "lg" },
  { title: "Full Width", value: "full" },
];

const LOTTIE_FIT_MODES = [
  { title: "Hybrid (Recommended)", value: "hybrid" },
  { title: "Contain (No Crop)", value: "contain" },
  { title: "Cover (Fill Container)", value: "cover" },
];

export default defineType({
  name: "lottie-1",
  title: "Lottie Block",
  type: "object",
  icon: Sparkles,
  description: "A Lottie animation section with configurable text placement and animation sizing",
  fields: [
    defineField({
      name: "padding",
      type: "section-padding",
    }),
    defineField({
      name: "colorVariant",
      type: "color-variant",
      title: "Color Variant",
      description: "Select a background color variant",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "block-content",
      description: "Optional companion text displayed alongside the animation",
    }),
    defineField({
      name: "textPosition",
      title: "Text Position",
      type: "string",
      description: "Position of the text relative to the Lottie animation",
      options: {
        list: TEXT_POSITIONS.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "right",
    }),
    defineField({
      name: "lottieFile",
      title: "Lottie File",
      type: "file",
      description: "Upload a Lottie JSON file (.json or .lottie)",
      options: {
        accept: ".json,.lottie,application/json",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "lottieSize",
      title: "Lottie Size",
      type: "string",
      description: "Control the size of the Lottie animation",
      options: {
        list: LOTTIE_SIZES.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "md",
    }),
    defineField({
      name: "lottieFit",
      title: "Lottie Fit Mode",
      type: "string",
      description:
        "Control how the animation fits the frame. Hybrid avoids clipping in side-by-side layouts.",
      options: {
        list: LOTTIE_FIT_MODES.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "hybrid",
    }),
    defineField({
      name: "lottieLoop",
      title: "Loop Animation",
      type: "boolean",
      description: "Whether the Lottie animation should loop",
      initialValue: true,
    }),
    defineField({
      name: "lottieAutoplay",
      title: "Autoplay",
      type: "boolean",
      description: "Whether the Lottie animation should play automatically",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare({ title }) {
      return {
        title: "Lottie Block",
        subtitle: title,
      };
    },
  },
});
