import type { ReactNode } from "react";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity";

import Footer from "@/components/footer";
import Header from "@/components/header";
import { DisableDraftMode } from "@/components/disable-draft-mode";
import {
  getEnabledLocales,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  getDocumentAlternates,
  type DocumentWithTranslations,
} from "@/i18n/routing";
import { SanityLive } from "@/sanity/lib/live";

type SiteShellProps = {
  children: ReactNode;
  locale: Locale;
  document?: DocumentWithTranslations | null;
  siteSettings?: Sanity.SiteSettings | null;
};

export default async function SiteShell({
  children,
  locale,
  document,
  siteSettings,
}: SiteShellProps) {
  const { isEnabled: isDraftMode } = await draftMode();
  const dictionary = getDictionary(locale);
  const visibleLocales = isDraftMode ? SUPPORTED_LOCALES : getEnabledLocales();
  const alternates = document
    ? getDocumentAlternates(document, visibleLocales)
    : {};

  return (
    <>
      <Header
        locale={locale}
        alternates={alternates}
        dictionary={dictionary}
        siteSettings={siteSettings}
      />
      <main>{children}</main>
      <SanityLive />
      {isDraftMode ? (
        <>
          <DisableDraftMode label={dictionary.draftMode.disable} />
          <VisualEditing />
        </>
      ) : null}
      <Footer locale={locale} dictionary={dictionary} />
    </>
  );
}
