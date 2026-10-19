import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { cleanCodeText, codeLanguages, type PortableTextCode } from "@/lib/portable-text-code";
import { highlightCode } from "@/lib/highlight-code";
import PortableTextCodeCopy from "@/components/portable-text-code-copy";

export default function PortableTextCodeBlock({ value, locale }: {
  value: PortableTextCode;
  locale: Locale;
}) {
  const code = cleanCodeText(value.code);
  if (!code.trim()) return null;
  const language = cleanCodeText(value.language).trim() || "text";
  const filename = cleanCodeText(value.filename).trim();
  const messages = getDictionary(locale).code;
  const label = language === "text" ? messages.text : codeLanguages.find(item => item.value === language)?.title ?? language;
  const highlightedLines = Array.isArray(value.highlightedLines) ? value.highlightedLines : [];
  const markup = highlightCode(code, language, highlightedLines);
  const regionLabel = `${messages.block}: ${filename || label}`;

  return (
    <figure data-carousel-interactive className="portable-code my-6 w-full min-w-0 max-w-full overflow-hidden rounded-xl border bg-card text-card-foreground">
      <figcaption className="flex min-w-0 items-center justify-between gap-3 border-b px-4 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="font-semibold">{label}</span>
          {filename ? <span className="break-all text-muted-foreground">{filename}</span> : null}
        </div>
        <PortableTextCodeCopy code={code} messages={messages} />
      </figcaption>
      <div role="region" aria-label={regionLabel} tabIndex={0}
        className="portable-code-scroll max-w-full overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        data-sanity-edit-target>
        {markup ? <div dangerouslySetInnerHTML={{ __html: markup }} /> : (
          <pre><code>{code.split("\n").map((line, index, lines) => (
            <span key={index} className={`line${highlightedLines.includes(index + 1) ? " highlighted" : ""}`}>
              {line}{index < lines.length - 1 ? "\n" : ""}
            </span>
          ))}</code></pre>
        )}
      </div>
    </figure>
  );
}
