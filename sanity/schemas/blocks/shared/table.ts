import { defineArrayMember, defineField, defineType } from "sanity";
import { Table2 } from "lucide-react";
import { validatePortableTextTable } from "@/lib/portable-text-table";

export const tableCellContent = defineType({
  name: "table-cell-content",
  title: "Contenido de la celda",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [{ title: "Normal", value: "normal" }],
      lists: [],
      marks: {
        decorators: [
          { title: "Negrita", value: "strong" },
          { title: "Cursiva", value: "em" },
        ],
        annotations: [
          {
            name: "link",
            title: "Enlace",
            type: "object",
            fields: [
              defineField({
                name: "href",
                title: "URL",
                type: "url",
                validation: (Rule) =>
                  Rule.required().uri({
                    allowRelative: true,
                    scheme: ["http", "https", "mailto", "tel"],
                  }),
              }),
            ],
          },
        ],
      },
    }),
  ],
});

export default defineType({
  name: "table",
  title: "Tabla",
  type: "object",
  icon: Table2,
  fields: [
    defineField({
      name: "caption",
      title: "Título de la tabla",
      type: "string",
    }),
    defineField({
      name: "headerRows",
      title: "Filas de encabezado",
      type: "number",
      initialValue: 1,
      validation: (Rule) => Rule.integer().min(0).max(1),
    }),
    defineField({
      name: "rows",
      title: "Filas",
      type: "array",
      of: [
        defineArrayMember({
          name: "row",
          type: "object",
          fields: [
            defineField({
              name: "cells",
              title: "Celdas",
              type: "array",
              of: [
                defineArrayMember({
                  name: "cell",
                  type: "object",
                  fields: [
                    defineField({
                      name: "value",
                      title: "Contenido",
                      type: "table-cell-content",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
  validation: (Rule) =>
    Rule.custom((value) => {
      const issues = validatePortableTextTable(value);
      return issues.length
        ? {
            message: [...new Set(issues.map((issue) => issue.message))].join(
              " ",
            ),
            paths: issues.map((issue) => issue.path),
          }
        : true;
    }),
  preview: {
    select: { caption: "caption", rows: "rows" },
    prepare({ caption, rows }) {
      return {
        title: caption || "Tabla",
        subtitle: `${rows?.length ?? 0} filas × ${rows?.[0]?.cells?.length ?? 0} columnas`,
        media: Table2,
      };
    },
  },
});
