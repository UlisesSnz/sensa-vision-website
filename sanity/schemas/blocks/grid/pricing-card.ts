import { defineField, defineType } from "sanity";
import { WalletCards } from "lucide-react";

export default defineType({
  name: "pricing-card",
  type: "object",
  icon: WalletCards,
  fields: [
    defineField({
      name: "title",
      type: "string",
    }),
    defineField({
      name: "tagLine",
      type: "string",
    }),
    defineField({
      name: "price",
      type: "object",
      fields: [
        defineField({
          name: "value",
          type: "number",
        }),
        defineField({
          name: "period",
          type: "string",
        }),
        defineField({
          name: "annualLabel",
          title: "Annual price label",
          description: "e.g. '35000 MXN/año'",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "featureGroups",
      title: "Feature groups",
      description: "Categorized feature lists with section headers",
      type: "array",
      of: [
        {
          type: "object",
          name: "featureGroup",
          fields: [
            defineField({
              name: "category",
              title: "Category name",
              type: "string",
            }),
            defineField({
              name: "features",
              type: "array",
              of: [{ type: "string" }],
            }),
          ],
          preview: {
            select: { title: "category", features: "features" },
            prepare({ title, features }) {
              return {
                title: title || "Group",
                subtitle: `${features?.length ?? 0} features`,
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: "list",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "pricingTiers",
      title: "Pricing tiers",
      description: "Volume-based pricing tiers (e.g. 1-2 pantallas / $4,059 MXN / -10%)",
      type: "array",
      of: [
        {
          type: "object",
          name: "pricingTier",
          fields: [
            defineField({
              name: "label",
              title: "Tier label",
              description: "e.g. '1-2 pantallas'",
              type: "string",
            }),
            defineField({
              name: "price",
              title: "Tier price",
              description: "e.g. '$4,059 MXN'",
              type: "string",
            }),
            defineField({
              name: "discount",
              title: "Discount label",
              description: "e.g. '-10%' (leave empty if no discount)",
              type: "string",
            }),
            defineField({
              name: "annualPrice",
              title: "Annual price",
              description: "e.g. '$43,500 MXN' (leave empty if no annual option)",
              type: "string",
            }),
            defineField({
              name: "annualDiscount",
              title: "Annual discount label",
              description: "e.g. '-15%' (leave empty if no discount)",
              type: "string",
            }),
          ],
          preview: {
            select: { label: "label", price: "price", discount: "discount" },
            prepare({ label, price, discount }) {
              return {
                title: label || "Tier",
                subtitle: `${price || ""}${discount ? ` / ${discount}` : ""}`,
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: "excerpt",
      type: "text",
    }),
    defineField({
      name: "link",
      type: "link",
    }),
  ],
  preview: {
    select: {
      title: "title",
      price: "price.value",
      period: "price.period",
    },
    prepare({ title, price, period }) {
      return {
        title: "Pricing Card",
        subtitle: `${title}: ${price}${period}`,
      };
    },
  },
});
