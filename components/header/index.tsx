import Link from "next/link";
import Image from "next/image";
import MobileNav from "@/components/header/mobile-nav";
import DesktopNav from "@/components/header/desktop-nav";
import { ModeToggle } from "@/components/menu-toggle";
import logo from "../../public/logo.png";

const navItems = [
  {
    label: "Inicio",
    href: "/",
    target: false,
  },
  {
    label: "Precios",
    href: "/pricing",
    target: false,
  },
  {
    label: "Características",
    href: "/features",
    target: false,
  },
  {
    label: "Casos de Uso",
    href: "/use-cases",
    target: false,
  },
  {
    label: "Contactar",
    href: "/contact",
    target: false,
  },
  {
    label: "Blog",
    href: "/blog",
    target: false,
  },
];

export default function Header() {
  return (
    <header className="sticky top-0 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm z-50">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" aria-label="Home page" className="flex items-center gap-2.5">
          <Image
            src={logo}
            alt="Sensa"
            priority
            width={30}
          />
          <span className="font-pixel text-lg font-bold">Sensa</span>
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
