import type {
  PortableTextTable,
  TableTextBlock,
} from "@/types/portable-text-table";

export function tableParagraph(
  text: string,
  key = "paragraph",
): TableTextBlock {
  return {
    _type: "block",
    _key: key,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: "text", text, marks: [] }],
  };
}

export function tableFixture(
  locale: "es" | "en" = "es",
  columns = 2,
): PortableTextTable {
  const content =
    locale === "es"
      ? [
          ["Plan", "Disponibilidad"],
          ["Básico", "Todos los días"],
          ["Avanzado", "24 horas"],
        ]
      : [
          ["Plan", "Availability"],
          ["Basic", "Every day"],
          ["Advanced", "24 hours"],
        ];
  return {
    _type: "table",
    _key: "table",
    headerRows: 1,
    caption: locale === "es" ? "Comparación de planes" : "Plan comparison",
    rows: content.map((row, rowIndex) => ({
      _type: "row",
      _key: `row-${rowIndex}`,
      cells: Array.from({ length: columns }, (_, index) => ({
        _type: "cell",
        _key: `cell-${index}`,
        value: [
          tableParagraph(
            row[index] ??
              `${locale === "es" ? "Columna" : "Column"} ${index + 1}`,
          ),
        ],
      })),
    })),
  };
}
