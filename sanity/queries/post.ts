import { groq } from "next-sanity";

export const POST_QUERY = groq`*[
    _type == "post" &&
    language == $locale &&
    slug.current == $slug
  ][0]{
    _id,
    _type,
    title,
    slug,
    language,
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
    body[]{
      ...,
      _type == "image" => {
        ...,
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
        }
      }
    },
    author->select(language == $locale => {
      _id,
      _type,
      language,
      name,
      image {
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
    }),
    categories[@->language == $locale][]->{
      _id,
      _type,
      language,
      title
    },
    _createdAt,
    _updatedAt,
    meta_title,
    meta_description,
    noindex,
    ogImage {
      asset->{
        _id,
        url,
        metadata {
          dimensions {
            width,
            height
          }
        }
      },
    },
    "translations": *[
      _type == "translation.metadata" && references(^._id)
    ][0].translations[].value->{
      _id,
      _type,
      slug,
      language
    }
}`;
