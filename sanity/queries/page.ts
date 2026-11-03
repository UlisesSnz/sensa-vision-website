import { groq } from "next-sanity";
import { hero1Query } from "./hero/hero-1";
import { hero2Query } from "./hero/hero-2";
import { sectionHeaderQuery } from "./section-header";
import { splitRowQuery } from "./split-row";
import { gridRowQuery } from "./grid/grid-row";
import { carousel1Query } from "./carousel/carousel-1";
import { carousel2Query } from "./carousel/carousel-2";
import { timelineQuery } from "./timeline";
import { cta1Query } from "./cta/cta-1";
import { logoCloud1Query } from "./logo-cloud/logo-cloud-1";
import { faqsQuery } from "./faqs";
import { formNewsletterQuery } from "./forms/newsletter";
import { formEmailJsQuery } from "./forms/emailjs";
import { video1Query } from "./video/video-1";
import { lottie1Query } from "./lottie/lottie-1";
import { desktopDownloadQuery } from "./desktop-download";

export const PAGE_QUERY = groq`
  *[_type == "page" && language == $locale && slug.current == $slug][0]{
    _id,
    _type,
    title,
    slug,
    language,
    blocks[]{
      _key,
      ${hero1Query}
      ${hero2Query}
      ${sectionHeaderQuery}
      ${splitRowQuery}
      ${gridRowQuery}
      ${carousel1Query}
      ${carousel2Query}
      ${timelineQuery}
      ${cta1Query}
      ${logoCloud1Query}
      ${faqsQuery}
      ${formNewsletterQuery}
      ${formEmailJsQuery}
      ${video1Query}
      ${lottie1Query}
      ${desktopDownloadQuery}
    },
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
  }
`;

export const PAGES_SLUGS_QUERY = groq`
  *[
    _type == "page" &&
    language in $locales &&
    defined(slug.current)
  ]{
    slug,
    language
  }
`;
