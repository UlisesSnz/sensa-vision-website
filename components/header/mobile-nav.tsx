"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDownIcon, TextAlignRightIcon } from "@radix-ui/react-icons";

import LanguageSwitcher from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Locale } from "@/i18n/config";
import type { UiDictionary } from "@/i18n/dictionaries";
import type { LocaleAlternates } from "@/i18n/routing";
import { toPublicPath } from "@/i18n/routing";
import type { NavItem } from "@/types";
import logo from "../../public/logo.png";

type MobileNavProps = {
  navItems: NavItem[];
  locale: Locale;
  alternates: LocaleAlternates;
  dictionary: UiDictionary;
};

export default function MobileNav({
  navItems,
  locale,
  alternates,
  dictionary,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setOpenDropdown(null);
  };

  const closeSheet = () => {
    setOpen(false);
    setOpenDropdown(null);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          aria-label={dictionary.navigation.openMenu}
          variant="ghost"
          className="w-[1.75rem] p-5 focus-visible:ring-1 focus-visible:ring-offset-1"
        >
          <TextAlignRightIcon className="dark:text-white" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div className="mr-6 flex items-center gap-3 ml-auto">
            <LanguageSwitcher
              locale={locale}
              alternates={alternates}
              ariaLabel={dictionary.navigation.changeLanguage}
              labels={dictionary.language}
            />
            <Link
              href={toPublicPath(locale, "/")}
              aria-label={dictionary.navigation.home}
              className="flex items-center gap-2"
              onClick={closeSheet}
            >
              <Image src={logo} alt="Sensa Vision Logo" priority width={30} />
            </Link>
          </div>
          <div className="sr-only">
            <SheetTitle>{dictionary.navigation.mainNavigation}</SheetTitle>
            <SheetDescription>
              {dictionary.navigation.navigationDescription}
            </SheetDescription>
          </div>
        </SheetHeader>
        <div className="pb-20 pt-10">
          <div className="container">
            <ul className="list-none space-y-3 text-right">
              {navItems.map((navItem, index) => {
                const hasSubLinks = Boolean(navItem.subLinks?.length);
                const navKey = `${navItem.label}-${navItem.href ?? index}`;
                const isExpanded = openDropdown === navKey;

                return (
                  <li key={navKey} className="space-y-2">
                    {hasSubLinks ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdown((current) =>
                              current === navKey ? null : navKey,
                            )
                          }
                          aria-expanded={isExpanded}
                          aria-controls={`${navKey}-submenu`}
                          className="ml-auto inline-flex items-center gap-2 text-lg hover:opacity-50 focus:outline-none focus-visible:opacity-80"
                        >
                          {navItem.label}
                          <ChevronDownIcon
                            aria-hidden
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isExpanded ? (
                          <ul
                            id={`${navKey}-submenu`}
                            className="space-y-2 border-r border-border/60 pr-4"
                          >
                            {navItem.subLinks?.map((subLink) => (
                              <li key={`${subLink.label}-${subLink.href}`}>
                                <Link
                                  onClick={closeSheet}
                                  href={subLink.href}
                                  target={subLink.target ? "_blank" : undefined}
                                  rel={
                                    subLink.target
                                      ? "noopener noreferrer"
                                      : undefined
                                  }
                                  className="text-sm text-foreground/70 hover:text-foreground"
                                >
                                  {subLink.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </>
                    ) : navItem.href ? (
                      <Link
                        onClick={closeSheet}
                        href={navItem.href}
                        target={navItem.target ? "_blank" : undefined}
                        rel={navItem.target ? "noopener noreferrer" : undefined}
                        className="text-lg hover:opacity-50"
                      >
                        {navItem.label}
                      </Link>
                    ) : (
                      <span className="text-lg">{navItem.label}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
