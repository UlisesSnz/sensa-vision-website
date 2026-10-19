import type { CodeInputValue } from "@sanity/code-input";
import { vercelStegaSplit } from "@vercel/stega";

export type PortableTextCode = CodeInputValue & { _type: "code"; _key: string };

export const codeLanguages = [
  { title: "Texto / Text", value: "text" },
  { title: "JavaScript", value: "javascript" },
  { title: "TypeScript", value: "typescript" },
  { title: "TSX", value: "tsx" },
  { title: "HTML", value: "html" },
  { title: "CSS", value: "css" },
  { title: "Bash", value: "bash", mode: "sh" },
  { title: "npm", value: "npm", mode: "sh" },
  { title: "Yarn", value: "yarn", mode: "sh" },
  { title: "pnpm", value: "pnpm", mode: "sh" },
  { title: "Python", value: "python" },
  { title: "JSON", value: "json" },
];

export const cleanCodeText = (value: unknown): string =>
  typeof value === "string" ? vercelStegaSplit(value).cleaned : "";

export function hasPortableTextCode(value: unknown): boolean {
  return Array.isArray(value) && value.some(block => block?._type === "code");
}

export function validateCodeContent(value: CodeInputValue | undefined) {
  return cleanCodeText(value?.code).trim().length > 0
    ? true
    : "Escribe código antes de publicar. / Enter code before publishing.";
}
