import Link from "next/link";
import { NavItem } from "@/types";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DesktopNav({ navItems }: { navItems: NavItem[] }) {
  return (
    <div className="hidden xl:flex items-center gap-7 text-primary">
      {navItems.map((navItem, index) => {
        const hasSubLinks = Boolean(navItem.subLinks?.length);
        const navKey = `${navItem.label}-${navItem.href ?? index}`;

        if (!hasSubLinks && navItem.href) {
          return (
            <Link
              key={navKey}
              href={navItem.href}
              target={navItem.target ? "_blank" : undefined}
              rel={navItem.target ? "noopener noreferrer" : undefined}
              className="text-foreground/60 text-sm font-medium transition-colors hover:text-foreground/80 focus:outline-none focus-visible:text-foreground/80"
            >
              {navItem.label}
            </Link>
          );
        }

        if (!hasSubLinks) {
          return (
            <span
              key={navKey}
              className="text-foreground/60 text-sm font-medium"
            >
              {navItem.label}
            </span>
          );
        }

        return (
          <DropdownMenu key={navKey}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground/80 focus:outline-none focus-visible:text-foreground/80 data-[state=open]:text-foreground/80 [&[data-state=open]>svg]:rotate-180"
                aria-label={`Open ${navItem.label} submenu`}
              >
                {navItem.label}
                <ChevronDownIcon
                  aria-hidden
                  className="h-3.5 w-3.5 transition-transform duration-200"
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="center"
              sideOffset={12}
              className="w-64 rounded-xl border border-border/80 bg-background/95 p-2 shadow-xl backdrop-blur-sm"
            >
              {navItem.subLinks?.map((subLink) => (
                <DropdownMenuItem
                  key={`${subLink.label}-${subLink.href}`}
                  asChild
                  className="rounded-lg p-0 focus:bg-transparent"
                >
                  <Link
                    href={subLink.href}
                    target={subLink.target ? "_blank" : undefined}
                    rel={subLink.target ? "noopener noreferrer" : undefined}
                    className="block w-full rounded-lg px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:bg-accent focus-visible:text-foreground"
                  >
                    {subLink.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </div>
  );
}
