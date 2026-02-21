import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { GeistPixelSquare } from "geist/font/pixel";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from '@vercel/analytics/next';

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  title: {
    template: "Sensa Tech | %s",
    default: "Sensa Tech | Marketing",
  },
  openGraph: {
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
        width: 1200,
        height: 630,
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  robots: !isProduction ? "noindex, nofollow" : "index, follow",
};

const fontSans = FontSans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const fontPixel = GeistPixelSquare;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased overscroll-none",
          fontSans.variable,
          fontPixel.variable
        )}
      >
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
