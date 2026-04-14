import { groq } from "next-sanity";

export const pricingCardQuery = groq`
  _type == "pricing-card" => {
    _type,
    title,
    tagLine,
    price,
    featureGroups[]{
      category,
      features[],
    },
    list[],
    pricingTiers[]{
      label,
      price,
      discount,
      annualPrice,
      annualDiscount,
    },
    excerpt,
    link,
  },
`;
