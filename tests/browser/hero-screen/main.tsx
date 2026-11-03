import { createRoot } from "react-dom/client";
import { evaluate, parse } from "groq-js";
import Hero2 from "@/components/ui/hero/hero-2";
import { PAGE_QUERY } from "@/sanity/queries/page";
import {
  pharmacySlides,
  tourSlides,
  templates,
} from "@/tests/fixtures/hero-screen";
import { splitParagraph } from "@/tests/fixtures/split-row";
import { releaseFixture } from "@/tests/fixtures/downloads";
import "@/app/globals.css";
import "../split/styles.css";

const params = new URLSearchParams(location.search);
const locale = params.get("locale") === "en" ? "en" : "es";
const en = locale === "en";
const scenario = params.get("scenario");
document.documentElement.lang = locale;
document.documentElement.classList.toggle(
  "dark",
  params.get("theme") === "dark",
);
document.body.classList.add("font-sans");
const root = createRoot(document.getElementById("root")!);
const query = parse(PAGE_QUERY);
const baseSlides = scenario === "tour" ? tourSlides : pharmacySlides;
const fixture = {
  _type: "hero-2",
  _key: "hero",
  baseScene: scenario === "tour" ? "office" : "pharmacy",
  slides:
    scenario === "empty"
      ? []
      : scenario === "single"
        ? baseSlides.slice(0, 1)
        : baseSlides,
  tagLine: en ? "Digital signage" : "Cartelería digital",
  title: en
    ? "Your message, on every screen."
    : "Tu mensaje, en cada pantalla.",
  body: [
    splitParagraph(
      en
        ? "From the shop window to the counter, give every space a screen of its own. Choose a template and make it yours."
        : "Del escaparate al mostrador, dale a cada espacio su propia pantalla. Elige una plantilla y hazla tuya.",
    ),
  ],
  links: [
    {
      _key: "demo",
      title: en ? "Explore templates" : "Explorar plantillas",
      href: "/features",
    },
    {
      _key: "download",
      title: en ? "Download Sensa" : "Descargar Sensa",
      targetType: "desktopDownload",
      buttonVariant: "outline",
    },
  ],
};

let revision = 0;
async function renderPage() {
  const current = ++revision;
  const saved =
    scenario === "saved" && localStorage.getItem("hero-screen-document");
  const block = saved
    ? { ...JSON.parse(saved), _type: "hero-2", _key: "hero" }
    : fixture;
  const page = {
    _type: "page",
    _id: "local-hero",
    language: locale,
    slug: { current: "index" },
    blocks: [block],
  };
  const result = await evaluate(query, {
    dataset: [page, ...templates],
    params: { locale, slug: "index" },
  });
  const { blocks } = await result.get();
  if (current === revision)
    root.render(
      <Hero2
        key={blocks[0]._key}
        {...blocks[0]}
        locale={locale}
        isFirstBlock
        desktopReleases={{
          "win32/x64": releaseFixture({
            platform: "win32",
            architecture: "x64",
          }),
        }}
      />,
    );
}
if (scenario === "saved") window.addEventListener("storage", renderPage);
void renderPage();
