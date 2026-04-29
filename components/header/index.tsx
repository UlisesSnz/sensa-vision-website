import Link from "next/link";
import Image from "next/image";
import MobileNav from "@/components/header/mobile-nav";
import DesktopNav from "@/components/header/desktop-nav";
import { ModeToggle } from "@/components/menu-toggle";
import { sanityFetch } from "@/sanity/lib/live";
import { SITE_SETTINGS_QUERY } from "@/sanity/queries/site-settings";
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

type SiteSettingsQueryResult = {
  headerNavigation?: RawNavItem[] | null;
};

const normalizeLink = (link: RawNavLink): NavChildItem | null => {
  const label = link.label?.trim();
  const href = link.href?.trim();

  if (!label || !href) {
    return null;
  }

  return {
    label,
    href,
    target: Boolean(link.target),
  };
};

const normalizeNavigation = (items: RawNavItem[] | null | undefined): NavItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map<NavItem | null>((item) => {
      const label = item.label?.trim();

      if (!label) {
        return null;
      }

      const href = item.href?.trim() || undefined;
      const target = Boolean(item.target);

      const subLinks = item.subLinks
        ?.map((subLink) => normalizeLink(subLink))
        .filter((subLink): subLink is NavChildItem => Boolean(subLink));

      if (subLinks && subLinks.length > 0) {
        return {
          label,
          href,
          target,
          subLinks,
        };
      }

      if (!href) {
        return null;
      }

      return {
        label,
        href,
        target,
      };
    })
    .filter((item): item is NavItem => item !== null);
};

async function getHeaderNavigation(): Promise<NavItem[]> {
  try {
    const { data } = await sanityFetch({
      query: SITE_SETTINGS_QUERY,
    });

    const cmsNavigation = normalizeNavigation(
      (data as SiteSettingsQueryResult | null)?.headerNavigation
    );

    if (cmsNavigation.length > 0) {
      return cmsNavigation;
    }
  } catch {
    return [];
  }

  return [];
}

export default async function Header() {
  const navItems = await getHeaderNavigation();

  return (
    <header className="sticky top-0 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm z-50">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" aria-label="Home page" className="flex items-center gap-2.5">
          <Image
            src={logo}
            alt="Sensa Vision Logo"
            priority
            width={30}
          />
          <span className="font-pixel text-lg font-bold">Sensa Vision</span>
          </Link>
        <div className="hidden xl:flex gap-7 items-center justify-between">
          <DesktopNav navItems={navItems} />
          <ModeToggle />
        </div>
        <div className="flex items-center xl:hidden">
          <ModeToggle />
          <MobileNav navItems={navItems} />
        </div>
      </div>
    </header>
  );
}
