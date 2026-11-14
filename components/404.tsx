import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { UiDictionary } from "@/i18n/dictionaries";
import { toPublicPath } from "@/i18n/routing";

export default function Custom404({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: UiDictionary;
}) {
  return (
    <main className="relative z-20 flex min-h-dvh items-center justify-center px-6 py-12 text-center sm:px-8">
      <div className="flex w-full max-w-2xl flex-col items-center">
        <h1 className="max-w-[16ch] font-pixel text-4xl font-bold leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
          {dictionary.notFound.title}
        </h1>
        <div className="mt-8">
          <Button size="lg" asChild>
            <Link href={toPublicPath(locale, "/")}>
              {dictionary.notFound.backHome}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
