import type { PortableTextCode } from "@/lib/portable-text-code";

export function codeFixture(overrides: Partial<PortableTextCode> = {}): PortableTextCode {
  return {
    _type: "code", _key: "example-code", language: "typescript", filename: "saludo.ts",
    code: 'const saludo: string = "Hola <mundo>";\n\n  console.log(saludo);\n',
    highlightedLines: [1, 3],
    ...overrides,
  };
}
