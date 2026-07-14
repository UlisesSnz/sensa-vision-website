import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { GeistPixelSquare } from "geist/font/pixel";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import {
  HTML_LANG_BY_LOCALE,
  OPEN_GRAPH_LOCALE_BY_LOCALE,
  DEFAULT_LOCALE,
  getEnabledLocales,
  isLocale,
} from "@/i18n/config";
import { cn } from "@/lib/utils";
import "../globals.css";

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

const fontSans = FontSans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const fontPixel = GeistPixelSquare;

export function generateStaticParams() {
  return getEnabledLocales().map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = isLocale(locale) ? locale : "es";

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
    title: {
      template: "Sensa Vision | %s",
      default: "Sensa Vision | Marketing",
    },
    openGraph: {
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
          width: 1200,
          height: 630,
        },
      ],
      locale: OPEN_GRAPH_LOCALE_BY_LOCALE[resolvedLocale],
      type: "website",
    },
    robots: !isProduction ? "noindex, nofollow" : "index, follow",
  };
}

export default async function LocalizedRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = isLocale(locale) ? locale : DEFAULT_LOCALE;

  return (
    <html
      lang={HTML_LANG_BY_LOCALE[resolvedLocale]}
      data-scroll-behavior="smooth"
      className={cn(fontSans.variable, fontPixel.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-screen overscroll-none bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
        </ThemeProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
