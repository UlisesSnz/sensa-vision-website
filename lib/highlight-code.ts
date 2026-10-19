import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import javascript from "shiki/langs/javascript.mjs";
import typescript from "shiki/langs/typescript.mjs";
import tsx from "shiki/langs/tsx.mjs";
import html from "shiki/langs/html.mjs";
import css from "shiki/langs/css.mjs";
import bash from "shiki/langs/bash.mjs";
import python from "shiki/langs/python.mjs";
import json from "shiki/langs/json.mjs";
import oneLight from "shiki/themes/one-light.mjs";
import oneDark from "shiki/themes/one-dark-pro.mjs";

// Imported only by the server renderer in the application. The local browser
// harness also imports it deliberately to exercise the same markup.
let highlighter: ReturnType<typeof createHighlighterCoreSync> | undefined;
const languages: Record<string, string> = {
  javascript: "javascript", js: "javascript", typescript: "typescript", ts: "typescript",
  tsx: "tsx", html: "html", css: "css", bash: "bash", sh: "bash", shell: "bash",
  npm: "bash", yarn: "bash", pnpm: "bash", python: "python", py: "python", json: "json",
};

export function highlightCode(code: string, language: string, highlightedLines: number[] = []) {
  const selected = new Set(highlightedLines.filter(line => Number.isInteger(line) && line > 0));
  try {
    highlighter ??= createHighlighterCoreSync({
      langs: [javascript, typescript, tsx, html, css, bash, python, json],
      themes: [oneLight, oneDark],
      engine: createJavaScriptRegexEngine(),
    });
    return highlighter.codeToHtml(code, {
      lang: languages[language.toLowerCase().trim()] ?? "text",
      themes: { light: "one-light", dark: "one-dark-pro" },
      defaultColor: false,
      transformers: [{
        name: "sanity-highlighted-lines",
        line(node, line) {
          if (selected.has(line)) this.addClassToHast(node, "highlighted");
        },
        pre(node) {
          // The outer scroll region is labelled and keyboard focusable.
          delete node.properties.tabIndex;
          delete node.properties.tabindex;
        },
      }],
    });
  } catch {
    // A malformed/unsupported grammar must not hide editorial content.
    return null;
  }
}
