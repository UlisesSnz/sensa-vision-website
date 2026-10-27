import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@sanity/client";
import {
  LayerProvider,
  ThemeProvider,
  ToastProvider,
  studioTheme,
} from "@sanity/ui";
import {
  LayerProvider as StudioLayerProvider,
  ThemeProvider as StudioThemeProvider,
} from "test-studio-ui";
import "test-studio-style";
import {
  ChangeIndicatorsTracker,
  createPatchChannel,
  createWorkspaceFromConfig,
  FormBuilder,
  LocaleProvider,
  ResourceCacheProvider,
  resolveInitialValueForType,
  SourceProvider,
  useFormState,
  validateDocument,
  WorkspaceProvider,
  type ObjectSchemaType,
  type PatchEvent,
  type Path,
  type SanityDocument,
  type ValidationMarker,
  type Workspace,
} from "sanity";
import {
  applyEditorPatches,
  initializedEmptyLink,
  splitLinkEditorDocument,
  splitLinkEditorTypes,
} from "@/tests/fixtures/split-link-editor";
import "./style.css";

// No production config, credentials, dataset or document service is loaded.
// Any accidental API request targets this local test server and fails the test.
const client = createClient({
  projectId: "localqa",
  dataset: "local",
  apiVersion: "2026-10-27",
  apiHost: "http://127.0.0.1:4177/api-disabled",
  useProjectHostname: false,
  useCdn: false,
});
// The app and Studio currently resolve separate @sanity/client versions.
// This client supplies the same public API and never connects to a real dataset.
const getClient = (() => client) as unknown as Workspace["getClient"];
const workspace = await createWorkspaceFromConfig({
  name: "local-editor",
  title: "Local editor",
  projectId: "localqa",
  dataset: "local",
  currentUser: {
    id: "local",
    name: "Local",
    email: "local@example.test",
    role: "administrator",
    roles: [{ name: "administrator", title: "Administrator" }],
  },
  getClient,
  schema: { types: splitLinkEditorTypes },
  form: {
    components: {
      // Keep the real field values, but avoid mounting image/Portable Text services.
      field: (props) =>
        props.path.length === 1 &&
        (new URLSearchParams(location.search).has("controls")
          ? ["image", "body"].includes(props.name)
          : props.name !== "link")
          ? null
          : props.renderDefault(props),
    },
  },
});
const schemaType = workspace.schema.get("splitLinkEditor") as ObjectSchemaType;
const initial = await resolveInitialValueForType(schemaType, {}, 5, {
  schema: workspace.schema,
  projectId: "localqa",
  dataset: "local",
  currentUser: workspace.currentUser,
  getClient,
});
const params = new URLSearchParams(location.search);
const fixture = params.get("fixture") || "new";
const readOnly = params.has("readonly");
const storageKey = `split-editor-${fixture}-${readOnly}`;
const baseline = splitLinkEditorDocument(initial);
if (fixture !== "new")
  baseline.link = {
    ...initializedEmptyLink,
    ...(fixture === "complete" ? { title: "Ver más", href: "/features" } : {}),
  };
const saved = localStorage.getItem(storageKey);
const startingDocument: SanityDocument = saved ? JSON.parse(saved) : baseline;
const patchChannel = createPatchChannel();
const noop = () => {};

function Editor() {
  const [document, setDocument] = useState(startingDocument);
  const [validation, setValidation] = useState<ValidationMarker[]>([]);
  const [validated, setValidated] = useState<SanityDocument>();
  const [focusPath, setFocusPath] = useState<Path>([]);
  const [openPath, setOpenPath] = useState<Path>([]);
  const onChange = useCallback((event: PatchEvent) => {
    setDocument((value) => applyEditorPatches(value, event.patches));
  }, []);
  useEffect(() => {
    let active = true;
    localStorage.setItem(storageKey, JSON.stringify(document));
    validateDocument({
      document,
      workspace,
      getDocumentExists: async () => true,
    }).then((markers) => {
      if (!active) return;
      setValidation(markers);
      setValidated(document);
    });
    return () => {
      active = false;
    };
  }, [document]);
  const formState = useFormState({
    schemaType,
    documentValue: document,
    comparisonValue: document,
    openPath,
    focusPath,
    perspective: "drafts",
    presence: [],
    validation,
    readOnly,
    hasUpstreamVersion: false,
  });
  const errors = validation.filter(({ level }) => level === "error");
  return (
    <main>
      <h1>Split Column · local form</h1>
      <p>Real Studio fields. Changes are saved only in this browser.</p>
      <section aria-label="Link editor">
        {formState && (
          <FormBuilder
            {...formState}
            id="split-editor"
            value={document}
            compareValue={document}
            schemaType={schemaType}
            __internal_patchChannel={patchChannel}
            focusPath={focusPath}
            openPath={openPath}
            focused={focusPath.length > 0}
            collapsedPaths={undefined}
            collapsedFieldSets={undefined}
            onChange={onChange}
            onPathFocus={setFocusPath}
            onPathBlur={() => setFocusPath([])}
            onPathOpen={setOpenPath}
            onFieldGroupSelect={noop}
            onSetFieldSetCollapsed={noop}
            onSetPathCollapsed={noop}
            presence={[]}
            validation={validation}
            readOnly={readOnly}
          />
        )}
      </section>
      <p
        role="status"
        data-testid="validation"
        data-ready={validated === document}
      >
        {validated !== document
          ? "Validating…"
          : `${errors.length} validation errors`}
      </p>
      <pre data-testid="errors">
        {JSON.stringify(errors.map(({ path, message }) => ({ path, message })))}
      </pre>
      <details>
        <summary>Local document</summary>
        <pre data-testid="document">{JSON.stringify(document, null, 2)}</pre>
      </details>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={studioTheme}>
    <LayerProvider>
      <ToastProvider>
        <WorkspaceProvider workspace={workspace}>
          <SourceProvider source={workspace.unstable_sources[0]}>
            <LocaleProvider>
              <StudioThemeProvider>
                <StudioLayerProvider>
                  <ResourceCacheProvider>
                    <ChangeIndicatorsTracker>
                      <Editor />
                    </ChangeIndicatorsTracker>
                  </ResourceCacheProvider>
                </StudioLayerProvider>
              </StudioThemeProvider>
            </LocaleProvider>
          </SourceProvider>
        </WorkspaceProvider>
      </ToastProvider>
    </LayerProvider>
  </ThemeProvider>,
);
