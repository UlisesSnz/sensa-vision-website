import { createRoot } from "react-dom/client";
import type { ComponentProps } from "react";
import SectionHeader from "@/components/ui/section-header";
import DesktopDownload from "@/components/ui/desktop-download";
import { getDictionary } from "@/i18n/dictionaries";
import { androidBody, installationHeader, releaseFixture } from "@/tests/fixtures/downloads";
import "@/app/globals.css";

const params = new URLSearchParams(location.search);
const locale = params.get("locale") === "en" ? "en" : "es";
const available = params.get("available") === "true";
document.documentElement.lang = locale;
document.documentElement.classList.toggle("dark", params.get("theme") === "dark");
document.documentElement.style.setProperty("--font-sans", "Arial");
document.body.classList.add("font-sans");
const common = {
  locale,
  downloadMessages: getDictionary(locale).downloads,
  padding: { top: true, bottom: true },
  desktopReleases: available ? {
    "win32/x64": releaseFixture({ platform: "win32", architecture: "x64" }),
    "linux/x64": releaseFixture({ platform: "linux", architecture: "x64" }),
  } : {},
} satisfies ComponentProps<typeof DesktopDownload>;

createRoot(document.getElementById("root")!).render(<main>
  <nav className="container pt-4"><a href="#requisitos">Ir a requisitos</a></nav>
  <section data-testid="installation"><SectionHeader {...installationHeader} locale={locale} /></section>
  <section data-testid="baseline"><SectionHeader {...installationHeader} uid="baseline" links={undefined} locale={locale} /></section>
  <section data-testid="centered"><SectionHeader {...installationHeader} uid="centered" stackAlign="center" sectionWidth="narrow" locale={locale} /></section>
  <section data-testid="empty-title"><SectionHeader title=" " description="Encabezado opcional sin título vacío." /></section>
  <section data-testid="downloads">
    <div data-testid="web"><SectionHeader title="Navegador web" description="Administra tus pantallas desde el navegador." padding={common.padding} /></div>
    <div data-testid="android"><DesktopDownload {...common} downloadPlatform="android" downloadArchitecture="x64" title="Android" tagLine="ANDROID · PRÓXIMAMENTE" body={androidBody} /></div>
    <div data-testid="windows"><DesktopDownload {...common} downloadPlatform="win32" downloadArchitecture="x64" title="Windows" /></div>
    <div data-testid="linux"><DesktopDownload {...common} downloadPlatform="linux" downloadArchitecture="x64" title="Linux" /></div>
  </section>
</main>);
