import { groq } from "next-sanity";

export const gridPostQuery = groq`
  _type == "grid-post" && post->language == $locale => {
    _type,
    ...post->{
      _id,
      _type,
      language,
      title,
      slug,
      excerpt,
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
      categories[@->language == $locale][]->{
        title,
      },
    },
  },
`;
