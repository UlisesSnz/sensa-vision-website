import { defineField, defineType } from "sanity";

export default defineType({
  name: "section-padding",
  type: "object",
  title: "Padding",
  description:
    "Activa el espacio estándar de la sección (64 px; 80 px en pantallas xl). Si un Section Header sin CTA comparte fondo con el bloque siguiente y ambos bordes están apagados, se aplica automáticamente una unión compacta de 24 px.",
  fields: [
    defineField({
      name: "top",
      type: "boolean",
      title: "Padding superior",
      description: "Añade el espacio estándar antes del contenido visible.",
    }),
    defineField({
      name: "bottom",
      type: "boolean",
      title: "Padding inferior",
      description: "Añade el espacio estándar después del contenido visible.",
    }),
  ],
});
