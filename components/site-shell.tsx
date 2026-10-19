import type { ReactNode } from "react";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";

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
import { sanityLiveAction } from "@/sanity/lib/live-action";

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
  const serverRevalidation = process.env.SANITY_SERVER_REVALIDATION_ENABLED === "true";
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
      <SanityLive
        waitFor={!isDraftMode && serverRevalidation ? "function" : undefined}
        action={isDraftMode || serverRevalidation ? "refresh" : sanityLiveAction}
      />
      {isDraftMode ? (
        <>
          <DisableDraftMode label={dictionary.draftMode.disable} />
          <VisualEditing />
        </>
      ) : null}
      <Footer
        locale={locale}
        dictionary={dictionary}
        padding={siteSettings?.footerPadding}
      />
    </>
  );
}
