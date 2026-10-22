import { createRoot } from "react-dom/client";
import GridRow from "@/components/ui/grid/grid-row";
import type { Locale } from "@/i18n/config";
import { pricingCases } from "@/tests/fixtures/pricing-card.mjs";
import "@/app/globals.css";

const theme = new URLSearchParams(location.search).get("theme");
document.documentElement.classList.toggle("dark", theme === "dark");
document.documentElement.style.setProperty("--font-sans", "Arial");
document.body.classList.add("font-sans");

createRoot(document.getElementById("root")!).render(
  <main>
    {pricingCases.map(({ id, locale, cards }) => (
      <section key={id} data-testid={id} aria-label={id}>
        <GridRow
          colorVariant="background"
          gridColumns="grid-cols-3"
          padding={{ top: true, bottom: true }}
          locale={locale as Locale}
          pricingMessages={locale === "es"
            ? { monthly: "Mensual", annual: "Anual" }
            : { monthly: "Monthly", annual: "Annual" }}
          columns={cards.map(({ value, ...card }, index) => ({
            ...card,
            _type: "pricing-card",
            _key: `${id}-${index}`,
            price: { value, period: "period" in card ? card.period : (locale === "es" ? "MXN al mes" : "MXN per month") },
            list: [],
            excerpt: "",
            link: { title: locale === "es" ? "Ver detalles" : "View details", href: "/contact", buttonVariant: "outline" },
          })) as Sanity.Block[]}
        />
      </section>
    ))}
  </main>,
);
