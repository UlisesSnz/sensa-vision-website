import { groq } from "next-sanity";

export const SITE_SETTINGS_QUERY = groq`
  *[
    _type == "siteSettings" &&
    _id in ["siteSettings", "drafts.siteSettings"]
  ] | order(_updatedAt desc)[0]{
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