import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_LOCALE,
  getEnabledLocales,
  isLocale,
  LOCALE_COOKIE_NAME,
} from "@/i18n/config";
import { detectPreferredLocale, isPublicFilePath } from "@/i18n/routing";

const EXCLUDED_PREFIXES = ["/api", "/studio", "/_next"];
const EXCLUDED_PATHS = new Set(["/favicon.ico", "/robots.txt", "/sitemap.xml"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    EXCLUDED_PATHS.has(pathname) ||
    EXCLUDED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) ||
    isPublicFilePath(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (isLocale(firstSegment)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-sensa-locale", firstSegment);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (pathname === "/") {
    const enabledLocales = getEnabledLocales();
    const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
    const preferredLocale = isLocale(cookieLocale)
      ? cookieLocale
      : detectPreferredLocale(request.headers.get("accept-language"));

    const locale = enabledLocales.includes(preferredLocale)
      ? preferredLocale
      : DEFAULT_LOCALE;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
