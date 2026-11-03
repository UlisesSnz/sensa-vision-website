import { MonitorPlay } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";
import HeroSceneInput from "@/sanity/components/hero-scene-input";
import {
  DEFAULT_HERO_SCENE,
  HERO_SCENES,
  isHeroScene,
} from "@/lib/hero-screen";
import { heroLayoutField } from "./layout";

const sceneOptions = {
  list: HERO_SCENES.map(({ title, value }) => ({ title, value })),
};
const blockTitle = "Hero · Template Screen";
const validateScene = (value?: string) =>
  !value || isHeroScene(value) || "Choose a scene from the list.";

export default defineType({
  name: "hero-2",
  title: blockTitle,
  type: "object",
  icon: MonitorPlay,
  fields: [
    heroLayoutField,
    defineField({ name: "tagLine", title: "Tagline", type: "string" }),
    defineField({ name: "title", title: "Heading", type: "string" }),
    defineField({ name: "body", title: "Body", type: "block-content" }),
    defineField({
      name: "links",
      title: "Buttons",
      type: "array",
      of: [{ type: "link" }],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: "baseScene",
      title: "Default scene",
      description: "Applies to every template unless overridden.",
      type: "string",
      options: sceneOptions,
      components: { input: HeroSceneInput },
      initialValue: DEFAULT_HERO_SCENE,
      validation: (rule) => rule.custom(validateScene),
    }),
    defineField({
      name: "slides",
      title: "Templates",
      type: "array",
      validation: (rule) =>
        rule.required().min(1).error("Add at least one template."),
      of: [
        defineArrayMember({
          name: "slide",
          type: "image",
          title: "Template",
          validation: (rule) => rule.required().assetRequired(),
          fields: [
            defineField({
              name: "alt",
              title: "Alt text",
              type: "string",
              validation: (rule) =>
                rule.required().regex(/\S/).error("Enter alt text."),
            }),
            defineField({
              name: "scene",
              type: "string",
              title: "Scene",
              options: sceneOptions,
              components: { input: HeroSceneInput },
              validation: (rule) => rule.custom(validateScene),
            }),
          ],
          preview: {
            select: { title: "alt", scene: "scene", asset: "asset" },
            prepare({ title, scene, asset }) {
              return {
                title: title || "Untitled template",
                subtitle:
                  HERO_SCENES.find((option) => option.value === scene)?.title ||
                  "Default scene",
                media: asset,
              };
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { subtitle: "title", media: "slides.0" },
    prepare: ({ subtitle, media }) => ({
      title: blockTitle,
      subtitle,
      media,
    }),
  },
});
