import type { PortableTextProps } from "@portabletext/react";
import type { Locale } from "@/i18n/config";
import PortableTextRenderer from "@/components/portable-text-renderer";
import TimelineAnimation from "./timeline-animation";

export interface Timeline1Props {
  color: "primary" | "secondary" | "card" | "accent" | "destructive" | "background" | "transparent";
  title: string;
  tagLine: string | null;
  body: PortableTextProps["value"];
  image: Sanity.Image;
  locale: Locale;
}

export default function Timeline1({ body, locale = "es", color, title, tagLine }: Partial<Timeline1Props>) {
  return (
    <TimelineAnimation color={color} title={title} tagLine={tagLine}>
      {body ? <PortableTextRenderer value={body} locale={locale} /> : null}
    </TimelineAnimation>
  );
}
