import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@sanity/client";
import { PerspectiveContext } from "sanity/_singletons";
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
import { ToastProvider as StudioToastProvider } from "test-studio-toast";
import "test-studio-style";
import {
  ChangeIndicatorsTracker,
  CopyPasteProvider,
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
  VirtualizerScrollInstanceProvider,
  type FormComponents,
  type SchemaTypeDefinition,
  type ObjectSchemaType,
  type PatchEvent,
  type Path,
  type SanityDocument,
  type ValidationMarker,
  type Workspace,
} from "sanity";
import { applyEditorPatches } from "@/tests/fixtures/split-link-editor";

export async function openLocalStudioForm(options: {
  types: SchemaTypeDefinition[];
  schemaName: string;
  title: string;
  label: string;
  storageKey: string;
  document: (initial: object) => SanityDocument;
  components: FormComponents;
  readOnly?: boolean;
}) {
  const { readOnly = false, storageKey } = options;

  // No production config, credentials, dataset or document service is loaded.
  // Any accidental API request targets this local test server and fails the test.
  const client = createClient({
    projectId: "localqa",
    dataset: "local",
    apiVersion: "2026-10-27",
    apiHost: `${location.origin}/api-disabled`,
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
    schema: { types: options.types },
    form: { components: options.components },
  });
  const schemaType = workspace.schema.get(
    options.schemaName,
  ) as ObjectSchemaType;
  const initial = await resolveInitialValueForType(schemaType, {}, 5, {
    schema: workspace.schema,
    projectId: "localqa",
    dataset: "local",
    currentUser: workspace.currentUser,
    getClient,
  });
  const saved = localStorage.getItem(storageKey);
  const startingDocument: SanityDocument = saved
    ? JSON.parse(saved)
    : options.document(initial);
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
        <h1>{options.title}</h1>
        <p>Real Studio fields. Changes are saved only in this browser.</p>
        <section aria-label={options.label}>
          {formState && (
            <FormBuilder
              {...formState}
              id={options.schemaName}
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
          {JSON.stringify(
            errors.map(({ path, message }) => ({ path, message })),
          )}
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
                        <StudioToastProvider>
                          <CopyPasteProvider>
                            <VirtualizerScrollInstanceProvider
                              scrollElement={document.documentElement}
                              containerElement={{
                                current: document.getElementById("root"),
                              }}
                            >
                              <PerspectiveContext.Provider
                                value={{
                                  selectedPerspective: "drafts",
                                  selectedPerspectiveName: undefined,
                                  selectedReleaseId: undefined,
                                  perspectiveStack: ["drafts"],
                                  excludedPerspectives: [],
                                  selectedVariants: [],
                                  selectedVariantNames: [],
                                  selectedVariantName: undefined,
                                  selectedVariant: undefined,
                                  bundle: "drafts",
                                }}
                              >
                                <Editor />
                              </PerspectiveContext.Provider>
                            </VirtualizerScrollInstanceProvider>
                          </CopyPasteProvider>
                        </StudioToastProvider>
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
}
