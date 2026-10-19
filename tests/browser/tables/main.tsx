import { useRef, useState } from "react";
import { codeSchema } from "@sanity/code-input";
import { createRoot } from "react-dom/client";
import {
  EditorProvider,
  PortableTextEditable,
  useEditor,
  useEditorSelector,
  type EditorEvent,
  type Editor,
  type PortableTextBlock,
} from "@portabletext/editor";
import {
  EditorRefPlugin,
  EventListenerPlugin,
} from "@portabletext/editor/plugins";
import { defineTable } from "@portabletext/plugin-table";
import { referenceContainers } from "@portabletext/plugin-table/ui";
import { sanitySchemaDefinitionToPortableTextSchema } from "@portabletext/sanity-bridge";
import { ThemeProvider, studioTheme } from "@sanity/ui";
import { tableContainers } from "@/sanity/components/portable-text-table";
import blockContent from "@/sanity/schemas/blocks/shared/block-content";
import tableSchema, {
  tableCellContent,
} from "@/sanity/schemas/blocks/shared/table";
import PortableTextRenderer from "@/components/portable-text-renderer";
import GridCard from "@/components/ui/grid/grid-card";
import FAQs from "@/components/ui/faqs";
import {
  tableFixture,
  tableParagraph,
} from "@/tests/fixtures/portable-text-table";
import { validatePortableTextTable } from "@/lib/portable-text-table";
import type { Locale } from "@/i18n/config";
import "@/app/globals.css";
import "./styles.css";

const nativeTable = defineTable({
  containers: { ...referenceContainers, ...tableContainers },
});
const schemaDefinition = sanitySchemaDefinitionToPortableTextSchema(
  blockContent,
  {
    types: [tableSchema, tableCellContent, codeSchema],
  },
);
const storageKey = "sensa-portable-text-tables-local-qa";
const initialValue = () => [
  tableParagraph("Antes de la tabla", "before"),
  tableParagraph("Después de la tabla", "after"),
];

function Toolbar() {
  const editor = useEditor();
  const readOnly = useEditorSelector(
    editor,
    (snapshot) => snapshot.context.readOnly,
  );
  const tableKey = useEditorSelector(
    editor,
    (snapshot) =>
      snapshot.context.value.find((block) => block._type === "table")?._key,
  );
  const commands: [string, EditorEvent][] = [
    [
      "Insertar tabla 3 × 3",
      {
        type: "insert.block",
        block: nativeTable.createBlock({ headerRows: 1 }),
        placement: "after",
      },
    ],
    ["Negrita", { type: "decorator.toggle", decorator: "strong" }],
    ["Cursiva", { type: "decorator.toggle", decorator: "em" }],
    [
      "Enlace /features",
      {
        type: "annotation.toggle",
        annotation: { name: "link", value: { href: "/features" } },
      },
    ],
    ["Deshacer", { type: "history.undo" }],
    ["Rehacer", { type: "history.redo" }],
    [
      "Subir tabla",
      { type: "move.block up", at: [{ _key: tableKey ?? "table" }] },
    ],
    [
      "Bajar tabla",
      { type: "move.block down", at: [{ _key: tableKey ?? "table" }] },
    ],
  ];
  return (
    <div className="qa-toolbar">
      {commands.map(([label, event]) => (
        <button
          key={label}
          disabled={readOnly}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.send(event)}
        >
          {label}
        </button>
      ))}
      <label>
        <input
          type="checkbox"
          checked={readOnly}
          onChange={(e) =>
            editor.send({ type: "update readOnly", readOnly: e.target.checked })
          }
        />{" "}
        Solo lectura
      </label>
    </div>
  );
}

function App() {
  const editorRef = useRef<Editor | null>(null);
  const [value, setValue] = useState<PortableTextBlock[]>(initialValue);
  const [editorValue, setEditorValue] = useState(value);
  const [revision, setRevision] = useState(0);
  const [locale, setLocale] = useState<Locale>("es");
  const [dark, setDark] = useState(false);
  const [status, setStatus] = useState("Sin guardar");
  const reopen = (next: PortableTextBlock[]) => {
    const serialized = JSON.parse(JSON.stringify(next)) as PortableTextBlock[];
    setValue(serialized);
    setEditorValue(serialized);
    setRevision((v) => v + 1);
  };
  const sample = (columns: number) => {
    const table = tableFixture(locale, columns);
    const content = table.rows[1].cells[0].value![0];
    content.children[0].text =
      "Contenido largo con negrita, cursiva y enlace. ".repeat(4);
    content.children[0].marks = ["strong", "em", "link"];
    content.markDefs = [{ _key: "link", _type: "link", href: "/features" }];
    reopen([
      tableParagraph("Antes de la tabla", "before"),
      table,
      tableParagraph("Después de la tabla", "after"),
    ]);
  };
  const issues = value
    .filter((v) => v._type === "table")
    .flatMap(validatePortableTextTable);
  return (
    <div className={dark ? "dark" : ""}>
      <main className="qa-page bg-background text-foreground">
        <h1>Tablas de Portable Text · QA local</h1>
        <p>
          Editor oficial y componentes del sitio. Persistencia simulada en este
          navegador; sin conexión al CMS.
        </p>
        <div className="qa-toolbar">
          <button onClick={() => reopen(initialValue())}>Reiniciar</button>
          <button onClick={() => sample(2)}>Tabla pequeña</button>
          <button onClick={() => sample(8)}>Tabla ancha</button>
          <button
            onClick={() => {
              localStorage.setItem(
                storageKey,
                JSON.stringify(
                  editorRef.current?.getSnapshot().context.value ?? value,
                ),
              );
              setStatus("Guardado local");
            }}
          >
            Guardar local
          </button>
          <button
            onClick={() => {
              const saved = localStorage.getItem(storageKey);
              if (saved) {
                reopen(JSON.parse(saved));
                setStatus("Reabierto desde JSON local");
              }
            }}
          >
            Reabrir
          </button>
          <label>
            Idioma{" "}
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={dark}
              onChange={(e) => setDark(e.target.checked)}
            />{" "}
            Tema oscuro
          </label>
        </div>
        <output>{status}</output>
        <section aria-label="Editor local" className="qa-editor">
          <ThemeProvider theme={studioTheme} scheme={dark ? "dark" : "light"}>
            <EditorProvider
              key={revision}
              initialConfig={{ schemaDefinition, initialValue: editorValue }}
            >
              <nativeTable.Plugin />
              <EditorRefPlugin ref={editorRef} />
              <EventListenerPlugin
                on={(event) => {
                  if (event.type === "mutation") {
                    setValue(event.value ?? []);
                    setStatus("Cambios locales sin guardar");
                  }
                }}
              />
              <Toolbar />
              <PortableTextEditable aria-label="Contenido Portable Text" />
            </EditorProvider>
          </ThemeProvider>
        </section>
        <output aria-label="Validación">
          {issues.length
            ? [...new Set(issues.map((i) => i.message))].join(" ")
            : "Tabla válida"}
        </output>
        <section aria-label="Render público" className="qa-preview">
          <h2>Render público / Presentation</h2>
          <PortableTextRenderer value={value} locale={locale} />
          <div className="qa-cards">
            <GridCard
              color="background"
              title="Tarjeta con tabla"
              excerpt={value}
              image={undefined as never}
              link={{
                href: "/contact",
                title: "Ver detalles",
                buttonVariant: "outline",
              }}
              locale={locale}
            />
            <div>
              <h2>Celda con enlace independiente</h2>
              <p>El título y CTA de la tarjeta conservan su propio destino.</p>
            </div>
          </div>
          <FAQs
            locale={locale}
            padding={{ top: false, bottom: false }}
            colorVariant="background"
            faqs={[
              {
                _id: "local",
                title: "¿Cómo se ve la tabla en una FAQ?",
                body: value,
              },
            ]}
          />
        </section>
        <details>
          <summary>Datos serializados</summary>
          <pre data-testid="serialized">{JSON.stringify(value, null, 2)}</pre>
        </details>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
