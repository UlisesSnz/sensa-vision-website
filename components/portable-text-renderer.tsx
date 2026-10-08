import { PortableText, type PortableTextProps } from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import PortableTextTable from "@/components/portable-text-table";

import type { Locale } from "@/i18n/config";
import { localizeHref } from "@/i18n/routing";
import { urlFor } from "@/sanity/lib/image";

const listBaseStyles = {
  paddingLeft: "1.5rem",
  marginBottom: "1rem",
  listStylePosition: "outside" as const,
};

function createPortableTextComponents(
  locale: Locale,
): PortableTextProps["components"] {
  return {
    types: {
      table: ({ value }) => <PortableTextTable value={value} locale={locale} />,
      image: ({ value }) => {
        const { url, metadata } = value.asset ?? {};
        const { lqip, dimensions } = metadata ?? {};
        const imageUrl = url || urlFor(value)?.url();
        if (!imageUrl) return null;
        return (
          <Image
            src={imageUrl}
            alt={value.alt || ""}
            width={dimensions?.width ?? 800}
            height={dimensions?.height ?? 600}
            {...(lqip ? { placeholder: "blur", blurDataURL: lqip } : {})}
            style={{
              borderRadius: "1rem",
              marginLeft: "auto",
              marginRight: "auto",
            }}
            quality={100}
          />
        );
      },
    },
    block: {
      normal: ({ children }) => <p className="mb-4">{children}</p>,
      h1: ({ children }) => <h1 className="my-4">{children}</h1>,
      h2: ({ children }) => <h2 className="my-4">{children}</h2>,
      h3: ({ children }) => <h3 className="my-4">{children}</h3>,
      h4: ({ children }) => <h4 className="my-4">{children}</h4>,
      h5: ({ children }) => <h5 className="my-4">{children}</h5>,
    },
    marks: {
      link: ({ value, children }) => {
        const href = typeof value?.href === "string" ? value.href : "#";
        const isExternal = /^(https?:|mailto:|tel:)/i.test(href);
        return (
          <Link
            href={localizeHref(href, locale)}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="underline"
          >
            {children}
          </Link>
        );
      },
    },
    list: {
      bullet: ({ children }) => (
        <ul style={{ ...listBaseStyles, listStyleType: "disc" }}>{children}</ul>
      ),
      number: ({ children }) => (
        <ol style={{ ...listBaseStyles, listStyleType: "decimal" }}>
          {children}
        </ol>
      ),
    },
    listItem: {
      bullet: ({ children }) => <li className="mb-2">{children}</li>,
      number: ({ children }) => <li className="mb-2">{children}</li>,
    },
  };
}

// Stable component types preserve focus and scroll during live preview updates.
const componentsByLocale: Record<Locale, PortableTextProps["components"]> = {
  es: createPortableTextComponents("es"),
  en: createPortableTextComponents("en"),
};

export default function PortableTextRenderer({
  value,
  locale,
}: {
  value: PortableTextProps["value"];
  locale: Locale;
}) {
  return (
    <PortableText
      value={value}
      components={componentsByLocale[locale]}
    />
  );
}
