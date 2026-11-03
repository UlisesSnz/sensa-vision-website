import { defineField } from "sanity";
import HeroLayoutInput from "@/sanity/components/hero-layout-input";
import { HERO_LAYOUTS } from "../shared/layout-variants";

export const heroLayoutField = defineField({
  name: "layout",
  title: "Layout",
  type: "string",
  initialValue: HERO_LAYOUTS[0].value,
  options: { list: HERO_LAYOUTS },
  components: { input: HeroLayoutInput },
});
