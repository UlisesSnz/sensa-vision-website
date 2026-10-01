import { groq } from "next-sanity";

export const SITE_SETTINGS_QUERY = groq`
  *[
    _type == "siteSettings" &&
    language == $locale
  ] | order(_updatedAt desc)[0]{
    _id,
    _type,
    language,
    footerPadding,
    headerNavigation[]{
      label,
      href,
      target,
      subLinks[]{
        label,
        href,
        target
      }
    }
  }
`;
