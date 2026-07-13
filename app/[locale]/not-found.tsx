"use client";

import { useParams } from "next/navigation";

import Custom404 from "@/components/404";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default function NotFoundPage() {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params?.locale) ? params.locale : DEFAULT_LOCALE;
  const dictionary = getDictionary(locale);

  return (
    <>
      <Header
        locale={locale}
        alternates={{}}
        dictionary={dictionary}
        siteSettings={null}
      />
      <main>
        <Custom404 locale={locale} dictionary={dictionary} />
      </main>
      <Footer locale={locale} dictionary={dictionary} />
    </>
  );
}
