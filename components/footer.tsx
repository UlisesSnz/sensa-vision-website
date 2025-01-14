import Link from "next/link";
import Image from "next/image";
import logo from "../public/logo.png";

const navItems = [
  {
    label: "Sobre Nosotros",
    href: "/about",
    target: false,
  },
];

export default function Footer() {
  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  return (
    <footer>
      <div className="conrtainer dark:bg-background pb-5 xl:pb-5 dark:text-gray-300">
        <Link
          className="block w-[3.25rem] mx-auto"
          href="/"
          aria-label="Página de inicio"
        >
          <Image
            src={logo}
            alt="Creativa Innova Tech"
            priority
          />
        </Link>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-7 text-primary">
          {navItems.map((navItem) => (
            <Link
              key={navItem.label}
              href={navItem.href}
              target={navItem.target ? "_blank" : undefined}
              rel={navItem.target ? "noopener noreferrer" : undefined}
              className="transition-colors hover:text-foreground/80 text-foreground/60 text-sm"
            >
              {navItem.label}
            </Link>
          ))}
        </div>
        <div className="mt-8 flex flex-col lg:flex-row gap-6 justify-center text-center lg:mt-5 text-xs border-t pt-8">
          <p className="text-foreground/60">
            &copy; {getCurrentYear()}{" "}
            Creativa Innova Tech
          </p>
        </div>
      </div>
    </footer>
  );
}
