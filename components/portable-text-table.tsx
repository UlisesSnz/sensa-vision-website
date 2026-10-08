import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizeHref } from "@/i18n/routing";
import {
  isPortableTextTable,
  visibleTableText,
} from "@/lib/portable-text-table";
import type { PortableTextTableCell } from "@/types/portable-text-table";

function createCellComponents(locale: Locale): Partial<PortableTextComponents> {
  return {
    block: {
      normal: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    },
    marks: {
      link: ({ value: link, children }) => {
        const href = visibleTableText(link.href).trim();
        const external = /^(https?:|mailto:|tel:|\/\/)/i.test(href);
        return (
          <Link
            href={localizeHref(href, locale)}
            className="underline underline-offset-2"
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
          >
            {children}
          </Link>
        );
      },
    },
  };
}

const cellComponentsByLocale: Record<Locale, Partial<PortableTextComponents>> = {
  es: createCellComponents("es"),
  en: createCellComponents("en"),
};

export default function PortableTextTable({
  value,
  locale,
}: {
  value: unknown;
  locale: Locale;
}) {
  if (!isPortableTextTable(value)) return null;
  const caption =
    value.caption && visibleTableText(value.caption).trim()
      ? value.caption
      : undefined;
  const hasHeader = value.headerRows === 1;
  const components = cellComponentsByLocale[locale];
  const renderCell = (cell: PortableTextTableCell, header: boolean) => {
    const Cell = header ? "th" : "td";
    return (
      <Cell
        key={cell._key}
        scope={header ? "col" : undefined}
        className="border-b border-r border-border px-4 py-3 align-top last:border-r-0 [overflow-wrap:anywhere]"
      >
        {cell.value?.length ? (
          <PortableText value={cell.value} components={components} />
        ) : null}
      </Cell>
    );
  };
  return (
    <div
      role="region"
      aria-label={
        caption
          ? visibleTableText(caption)
          : locale === "es"
            ? "Tabla de datos"
            : "Data table"
      }
      tabIndex={0}
      className="my-4 w-full min-w-0 max-w-full overflow-x-auto rounded-lg border border-border bg-background text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-current"
    >
      <table
        className="w-full table-fixed border-collapse text-left text-base leading-relaxed [&_tbody_tr:last-child>td]:border-b-0"
        style={{ minWidth: `${value.rows[0].cells.length * 10}rem` }}
      >
        {caption && (
          <caption className="caption-top border-b border-border px-4 py-3 text-left font-medium">
            {caption}
          </caption>
        )}
        {hasHeader && (
          <thead className="bg-muted font-semibold">
            <tr>{value.rows[0].cells.map((cell) => renderCell(cell, true))}</tr>
          </thead>
        )}
        <tbody>
          {value.rows.slice(hasHeader ? 1 : 0).map((row) => (
            <tr key={row._key}>
              {row.cells.map((cell) => renderCell(cell, false))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
