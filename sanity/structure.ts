import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import {
  Files,
  BookA,
  User,
  ListCollapse,
  Quote,
  Navigation,
  Languages,
} from "lucide-react";

import { SANITY_LANGUAGES } from "./i18n";

type LanguageId = (typeof SANITY_LANGUAGES)[number]["id"];

type StructureContext = Parameters<
  typeof orderableDocumentListDeskItem
>[0]["context"];
type StructureBuilder = Parameters<
  typeof orderableDocumentListDeskItem
>[0]["S"];

const ORDERABLE_TYPES = [
  { type: "page", title: "Pages", icon: Files },
  { type: "category", title: "Categories", icon: BookA },
  { type: "author", title: "Authors", icon: User },
  { type: "faq", title: "FAQs", icon: ListCollapse },
  { type: "testimonial", title: "Testimonials", icon: Quote },
] as const;

function languageFilter(language: LanguageId) {
  return {
    filter: "language == $language",
    params: { language },
  };
}

function localizedContentList(
  S: StructureBuilder,
  context: StructureContext,
  language: (typeof SANITY_LANGUAGES)[number],
) {
  const filter = languageFilter(language.id);

  return S.list()
    .title(language.title)
    .items([
      S.listItem()
        .title("Site Settings")
        .icon(Navigation)
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId(
              language.id === "es" ? "siteSettings" : "siteSettings-en",
            ),
        ),
      S.divider(),
      ...ORDERABLE_TYPES.map(({ type, title, icon }) =>
        orderableDocumentListDeskItem({
          type,
          id: `${type}-${language.id}`,
          title,
          icon,
          filter: filter.filter,
          params: filter.params,
          createIntent: false,
          S,
          context,
        }),
      ),
      S.listItem()
        .title("Posts")
        .schemaType("post")
        .child(
          S.documentTypeList("post")
            .title("Posts")
            .filter("_type == $type && language == $language")
            .params({ type: "post", language: language.id })
            .defaultOrdering([{ field: "_createdAt", direction: "desc" }]),
        ),
    ]);
}

export const structure = (S: StructureBuilder, context: StructureContext) =>
  S.list()
    .title("Content")
    .items(
      SANITY_LANGUAGES.map((language) =>
        S.listItem()
          .id(`content-${language.id}`)
          .title(language.title)
          .icon(Languages)
          .child(localizedContentList(S, context, language)),
      ),
    );
