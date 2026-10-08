import { vercelStegaSplit } from "@vercel/stega";
import type { PortableTextTable } from "@/types/portable-text-table";

type Path = Array<string | number | { _key: string }>;
export type TableIssue = { message: string; path: Path };

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const visibleTableText = (value: string) =>
  vercelStegaSplit(value).cleaned;

export function hasPortableTextTable(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.some((block) => object(block) && block._type === "table")
  );
}

export function isTableLinkHref(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const href = visibleTableText(value).trim();
  if (
    !href ||
    Array.from(href).some(
      (char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127,
    )
  )
    return false;
  const scheme = href.match(/^([a-z][a-z\d+.-]*):/i)?.[1]?.toLowerCase();
  if (scheme && !["http", "https", "mailto", "tel"].includes(scheme))
    return false;
  try {
    const url = new URL(href, "https://example.invalid");
    return (
      ["http:", "https:"].includes(url.protocol) || url.pathname.length > 0
    );
  } catch {
    return false;
  }
}

/** Shared by Studio validation and the public renderer; never changes CMS data. */
export function validatePortableTextTable(value: unknown): TableIssue[] {
  const issues: TableIssue[] = [];
  const error = (message: string, path: Path) => issues.push({ message, path });
  const keyedItems = (items: unknown[], path: Path) => {
    const keys = new Set<string>();
    return items.map((item, index) => {
      const key =
        object(item) && typeof item._key === "string" ? item._key : "";
      const itemPath = [...path, key ? { _key: key } : index];
      if (!key || keys.has(key))
        error("Cada elemento necesita una clave única.", itemPath);
      keys.add(key);
      return itemPath;
    });
  };
  if (!object(value) || value._type !== "table") {
    return [{ message: "La tabla no tiene una estructura válida.", path: [] }];
  }
  if (typeof value._key !== "string" || !value._key) {
    error("La tabla necesita una clave.", []);
  }
  if (value.caption !== undefined && typeof value.caption !== "string") {
    error("El título de la tabla debe ser texto.", ["caption"]);
  }
  const headerRows = value.headerRows === undefined ? 0 : value.headerRows;
  if (headerRows !== 0 && headerRows !== 1) {
    error("La tabla puede tener cero o una fila de encabezados.", [
      "headerRows",
    ]);
  }
  if (!Array.isArray(value.rows) || value.rows.length === 0) {
    error("Agrega al menos una fila a la tabla.", ["rows"]);
    return issues;
  }
  const rows = value.rows;
  const rowPaths = keyedItems(rows, ["rows"]);
  const width =
    object(rows[0]) && Array.isArray(rows[0].cells) ? rows[0].cells.length : 0;
  let hasContent = false;
  rows.forEach((row, rowIndex) => {
    const rowPath = rowPaths[rowIndex];
    if (!object(row) || row._type !== "row" || !Array.isArray(row.cells)) {
      error("La fila debe contener celdas.", rowPath);
      return;
    }
    if (!row.cells.length)
      error("Agrega al menos una columna.", [...rowPath, "cells"]);
    if (row.cells.length !== width) {
      error("Todas las filas deben tener la misma cantidad de celdas.", [
        ...rowPath,
        "cells",
      ]);
    }
    const cellPaths = keyedItems(row.cells, [...rowPath, "cells"]);
    row.cells.forEach((cell, cellIndex) => {
      const cellPath = cellPaths[cellIndex];
      let cellHasContent = false;
      if (
        !object(cell) ||
        cell._type !== "cell" ||
        (cell.value !== undefined && !Array.isArray(cell.value))
      ) {
        error("La celda debe contener texto con formato básico.", cellPath);
        return;
      }
      const blocks = (cell.value ?? []) as unknown[];
      const blockPaths = keyedItems(blocks, [...cellPath, "value"]);
      blocks.forEach((block, blockIndex) => {
        const blockPath = blockPaths[blockIndex];
        if (
          !object(block) ||
          block._type !== "block" ||
          (block.style !== undefined && block.style !== "normal") ||
          block.listItem !== undefined ||
          block.level !== undefined ||
          !Array.isArray(block.children)
        ) {
          error(
            "Usa solo párrafos, negritas, cursivas y enlaces dentro de las celdas.",
            blockPath,
          );
          return;
        }
        const annotations = block.markDefs ?? [];
        const marks = new Set(["strong", "em"]);
        if (!Array.isArray(annotations)) {
          error("Los enlaces de la celda no son válidos.", [
            ...blockPath,
            "markDefs",
          ]);
        } else {
          const paths = keyedItems(annotations, [...blockPath, "markDefs"]);
          annotations.forEach((annotation, index) => {
            if (
              !object(annotation) ||
              annotation._type !== "link" ||
              !isTableLinkHref(annotation.href)
            ) {
              error(
                "Usa un enlace válido: relativo, http, https, mailto o tel.",
                paths[index],
              );
            } else if (typeof annotation._key === "string")
              marks.add(annotation._key);
          });
        }
        const spanPaths = keyedItems(block.children, [
          ...blockPath,
          "children",
        ]);
        block.children.forEach((span, index) => {
          if (
            !object(span) ||
            span._type !== "span" ||
            typeof span.text !== "string" ||
            (span.marks !== undefined &&
              (!Array.isArray(span.marks) ||
                span.marks.some(
                  (mark) => typeof mark !== "string" || !marks.has(mark),
                )))
          ) {
            error(
              "La celda contiene texto o formato no admitido.",
              spanPaths[index],
            );
            return;
          }
          if (visibleTableText(span.text).trim()) cellHasContent = true;
        });
      });
      if (headerRows === 1 && rowIndex === 0 && !cellHasContent) {
        error("Escribe un encabezado para esta columna.", cellPath);
      }
      hasContent ||= cellHasContent;
    });
  });
  if (!hasContent)
    error("La tabla debe contener texto en al menos una celda.", ["rows"]);
  return issues;
}

export function isPortableTextTable(
  value: unknown,
): value is PortableTextTable {
  return validatePortableTextTable(value).length === 0;
}
