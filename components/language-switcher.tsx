"use client";

import Link from "next/link";

import {
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  type Locale,
} from "@/i18n/config";
import type { LocaleAlternates } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  locale: Locale;
  alternates: LocaleAlternates;
  ariaLabel: string;
  labels: Record<Locale, string>;
  className?: string;
};

export default function LanguageSwitcher({
  locale,
  alternates,
  ariaLabel,
  labels,
  className,
}: LanguageSwitcherProps) {
  const targetLocales = (Object.keys(alternates) as Locale[]).filter(
    (candidate) => candidate !== locale && Boolean(alternates[candidate]),
  );

  if (targetLocales.length === 0) return null;

  const rememberLocale = (nextLocale: Locale) => {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  };

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center rounded-full border border-border/70 p-0.5 text-xs font-semibold",
        className,
      )}
    >
      {(Object.keys(alternates) as Locale[]).map((candidate) => {
        const href = alternates[candidate];
        if (!href) return null;

        if (candidate === locale) {
          return (
            <span
              key={candidate}
              aria-current="page"
              className="rounded-full bg-foreground px-2.5 py-1 text-background"
              title={labels[candidate]}
            >
              {candidate.toUpperCase()}
            </span>
          );
        }

        return (
          <Link
            key={candidate}
            href={href}
            hrefLang={candidate}
            lang={candidate}
            onClick={() => rememberLocale(candidate)}
            className="rounded-full px-2.5 py-1 text-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={labels[candidate]}
          >
            {candidate.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
