import "server-only";

import { draftMode } from "next/headers";

import { getEnabledLocales, isLocale, type Locale } from "./config";

export async function resolveAvailableLocale(
  value: string,
): Promise<Locale | null> {
  if (!isLocale(value)) return null;
  if (getEnabledLocales().includes(value)) return value;

  return (await draftMode()).isEnabled ? value : null;
}
