import type { Locale } from "@/i18n/config";
import { formatDate } from "@/lib/utils";

export default function PostDate({
  date,
  locale,
}: {
  date: string;
  locale: Locale;
}) {
  return <div>{date ? formatDate(date, locale) : null}</div>;
}
