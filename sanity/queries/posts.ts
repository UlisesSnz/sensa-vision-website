import { groq } from "next-sanity";

export const POSTS_QUERY = groq`*[
  _type == "post" &&
  language == $locale &&
  defined(slug.current)
] | order(_createdAt desc){
    _id,
    _type,
    title,
    slug,
    language,
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
}`;

export const POSTS_SLUGS_QUERY = groq`*[
  _type == "post" &&
  language in $locales &&
  defined(slug.current)
]{
  slug,
  language
}`;
