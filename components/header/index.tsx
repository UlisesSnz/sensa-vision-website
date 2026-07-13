import Image from "next/image";
import Link from "next/link";

import DesktopNav from "@/components/header/desktop-nav";
import MobileNav from "@/components/header/mobile-nav";
import LanguageSwitcher from "@/components/language-switcher";
import { ModeToggle } from "@/components/menu-toggle";
import type { Locale } from "@/i18n/config";
import type { UiDictionary } from "@/i18n/dictionaries";
import type { LocaleAlternates } from "@/i18n/routing";
import { localizeHref, toPublicPath } from "@/i18n/routing";
import type { NavChildItem, NavItem } from "@/types";
import logo from "../../public/logo.png";

type RawNavLink = {
  label?: string | null;
  href?: string | null;
  target?: boolean | null;
};

type RawNavItem = RawNavLink & {
  subLinks?: RawNavLink[] | null;
};

const normalizeLink = (
  link: RawNavLink,
  locale: Locale,
): NavChildItem | null => {
  const label = link.label?.trim();
  const href = link.href?.trim();

  if (!label || !href) return null;

  return {
    label,
    href: localizeHref(href, locale),
    target: Boolean(link.target),
  };
};

const normalizeNavigation = (
  items: RawNavItem[] | null | undefined,
  locale: Locale,
): NavItem[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map<NavItem | null>((item) => {
      const label = item.label?.trim();
      if (!label) return null;

      const href = item.href?.trim()
        ? localizeHref(item.href.trim(), locale)
        : undefined;
      const target = Boolean(item.target);
      const subLinks = item.subLinks
        ?.map((subLink) => normalizeLink(subLink, locale))
        .filter((subLink): subLink is NavChildItem => Boolean(subLink));

      if (subLinks?.length) return { label, href, target, subLinks };
      if (!href) return null;
      return { label, href, target };
    })
    .filter((item): item is NavItem => item !== null);
};

type HeaderProps = {
  locale: Locale;
  alternates: LocaleAlternates;
  dictionary: UiDictionary;
  siteSettings?: Sanity.SiteSettings | null;
};

export default function Header({
  locale,
  alternates,
  dictionary,
  siteSettings,
}: HeaderProps) {
  const navItems = normalizeNavigation(siteSettings?.headerNavigation, locale);
  const homePath = toPublicPath(locale, "/");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href={homePath}
          aria-label={dictionary.navigation.home}
          className="flex items-center gap-2.5"
        >
          <Image src={logo} alt="Sensa Vision Logo" priority width={30} />
          <span className="font-pixel text-lg font-bold">Sensa Vision</span>
        </Link>
        <div className="hidden items-center justify-between gap-7 xl:flex">
          <DesktopNav
            navItems={navItems}
            openSubmenuLabel={dictionary.navigation.openSubmenu}
          />
          <LanguageSwitcher
            locale={locale}
            alternates={alternates}
            ariaLabel={dictionary.navigation.changeLanguage}
            labels={dictionary.language}
          />
          <ModeToggle messages={dictionary.theme} />
        </div>
        <div className="flex items-center xl:hidden">
          <ModeToggle messages={dictionary.theme} />
          <MobileNav
            navItems={navItems}
            locale={locale}
            alternates={alternates}
            dictionary={dictionary}
          />
        </div>
      </div>
    </header>
  );
}
