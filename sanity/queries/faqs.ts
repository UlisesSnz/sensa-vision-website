import { groq } from "next-sanity";

export const faqsQuery = groq`
  _type == "faqs" => {
    _type,
    padding,
    colorVariant,
    faqs[@->language == $locale][]->{
      _id,
      _type,
      language,
      title,
      body,
    },
  },
`;
