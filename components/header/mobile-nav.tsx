"use client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NavItem } from "@/types";
import { useState } from "react";
import { ChevronDownIcon, TextAlignRightIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import logo from "../../public/logo.png";


export default function MobileNav({ navItems }: { navItems: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setOpenDropdown(null);
    }
  };

  const handleDropdownToggle = (navKey: string) => {
    setOpenDropdown((currentOpen) =>
      currentOpen === navKey ? null : navKey
    );
  };

  const closeSheet = () => {
    setOpen(false);
    setOpenDropdown(null);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          aria-label="Open Menu"
          variant="ghost"
          className="w-[1.75rem] p-5 focus-visible:ring-1 focus-visible:ring-offset-1"
        >
          <TextAlignRightIcon className="dark:text-white" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div className="mr-6 ml-auto">
          <Link href="/" aria-label="Home page" className="flex items-center gap-2">
            <Image
              src={logo}
              alt="Sensa Vision Logo"
              priority
              width={30}
            />
        </Link>
          </div>
          <div className="sr-only">
            <SheetTitle>Main Navigation</SheetTitle>
            <SheetDescription>Navigate to the website pages</SheetDescription>
          </div>
        </SheetHeader>
        <div className="pt-10 pb-20">
          <div className="container">
            <ul className="list-none text-right space-y-3">
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
                          onClick={() => handleDropdownToggle(navKey)}
                          aria-expanded={isExpanded}
                          aria-controls={`${navKey}-submenu`}
                          className="ml-auto inline-flex items-center gap-2 text-lg hover:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {navItem.label}
                          <ChevronDownIcon
                            aria-hidden
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isExpanded && (
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
                                  rel={subLink.target ? "noopener noreferrer" : undefined}
                                  className="text-sm text-foreground/70 hover:text-foreground"
                                >
                                  {subLink.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : navItem.href ? (
                      <Link
                        onClick={closeSheet}
                        href={navItem.href}
                        target={navItem.target ? "_blank" : undefined}
                        rel={navItem.target ? "noopener noreferrer" : undefined}
                        className="hover:opacity-50 text-lg"
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
