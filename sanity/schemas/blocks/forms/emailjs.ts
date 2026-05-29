import { defineField, defineType } from "sanity";
import { Send } from "lucide-react";
import { STACK_ALIGN } from "../shared/layout-variants";

const FORM_FIELD_TYPES = [
  { title: "Short Text", value: "text" },
  { title: "Email", value: "email" },
  { title: "Phone", value: "tel" },
  { title: "Long Text", value: "textarea" },
];

const TEMPLATE_KEYS = [
  { title: "Contact", value: "contact" },
  { title: "Quote", value: "quote" },
  { title: "Support", value: "support" },
];

export default defineType({
  name: "form-emailjs",
  type: "object",
  title: "Form: EmailJS",
  description:
    "Reusable form block powered by EmailJS. Configure fields once and place this form on any page.",
  icon: Send,
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
      name: "stackAlign",
      type: "string",
      title: "Stack Layout Alignment",
      options: {
        list: STACK_ALIGN.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "left",
    }),
    defineField({
      name: "internalName",
      title: "Internal Form Name",
      description: "Only used for analytics and tracking in submissions.",
      type: "string",
      validation: (Rule) => Rule.required().max(80),
      initialValue: "contact-form",
    }),
    defineField({
      name: "templateKey",
      title: "EmailJS Template Key",
      description:
        "Must match one of your configured template keys in environment variables.",
      type: "string",
      options: {
        list: TEMPLATE_KEYS.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "contact",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      validation: (Rule) => Rule.required(),
      initialValue: "Envíanos un mensaje",
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      initialValue:
        "Cuéntanos qué necesitas y te responderemos lo antes posible.",
    }),
    defineField({
      name: "fields",
      title: "Fields",
      type: "array",
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .max(8)
          .custom((value) => {
            if (!Array.isArray(value)) {
              return true;
            }

            const names = value
              .map((item) => {
                const candidate = (item as { name?: unknown })?.name;
                return typeof candidate === "string" ? candidate.trim() : "";
              })
              .filter(Boolean);

            return names.length === new Set(names).size
              ? true
              : "Field names must be unique";
          }),
      of: [
        {
          name: "field",
          title: "Field",
          type: "object",
          fields: [
            defineField({
              name: "name",
              title: "Field Name",
              description:
                "Technical key used in EmailJS variables. Use snake_case (example: phone_number).",
              type: "string",
              validation: (Rule) =>
                Rule.required().regex(/^[a-z][a-z0-9_]*$/, {
                  name: "snake_case",
                }),
            }),
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "placeholder",
              title: "Placeholder",
              type: "string",
            }),
            defineField({
              name: "fieldType",
              title: "Field Type",
              type: "string",
              options: {
                list: FORM_FIELD_TYPES.map(({ title, value }) => ({
                  title,
                  value,
                })),
                layout: "dropdown",
              },
              initialValue: "text",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "required",
              title: "Required",
              type: "boolean",
              initialValue: true,
            }),
          ],
          preview: {
            select: {
              label: "label",
              name: "name",
              fieldType: "fieldType",
            },
            prepare({ label, name, fieldType }) {
              return {
                title: label || "Field",
                subtitle: `${fieldType || "text"} - ${name || "unnamed"}`,
              };
            },
          },
        },
      ],
      initialValue: [
        {
          _type: "field",
          name: "name",
          label: "Name",
          fieldType: "text",
          required: true,
        },
        {
          _type: "field",
          name: "email",
          label: "Email",
          fieldType: "email",
          required: true,
        },
        {
          _type: "field",
          name: "message",
          label: "Message",
          fieldType: "textarea",
          required: true,
        },
      ],
    }),
    defineField({
      name: "consentText",
      type: "text",
      rows: 2,
      initialValue:
        "Al enviar este formulario, acepta que nos pongamos en contacto con usted en relación con su solicitud.",
    }),
    defineField({
      name: "buttonText",
      type: "string",
      initialValue: "Enviar",
    }),
    defineField({
      name: "successMessage",
      type: "text",
      initialValue: "Gracias, mensaje enviado correctamente.",
    }),
    defineField({
      name: "errorMessage",
      type: "text",
      initialValue: "No pudimos enviar tu mensaje. Por favor, inténtalo de nuevo.",
    }),
  ],
  preview: {
    select: {
      title: "title",
      internalName: "internalName",
    },
    prepare({ title, internalName }) {
      return {
        title: title || "EmailJS Form",
        subtitle: internalName || "form-emailjs",
      };
    },
  },
});
