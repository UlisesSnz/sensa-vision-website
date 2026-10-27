import { groq } from "next-sanity";

export const splitRowQuery = groq`
  _type == "split-row" => {
    _type,
    _key,
    uid,
    padding,
    colorVariant,
    splitColumns[]{
      _key,
      position,
      layout,
      imageFit,
      headingLevel,
      sectionWidth,
      contentWidth,
      stackAlign,
      tagLine,
      title,
      body,
      image{
        asset->{
          _id,
          url,
          mimeType,
          metadata {
            lqip,
            dimensions {
              width,
              height
            }
          }
        },
        alt
      },
      link,
    },
  },
`;
