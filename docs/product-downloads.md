# Product links and Android presentation

Implementation for [issue #10](https://github.com/UlisesSnz/sensa-website/issues/10).
This change does not migrate or publish CMS content.

## Contract and compatibility

- `section-header.links` is an optional array of the existing `link` type. It uses
  the existing button variants, locale routing and desktop download destinations.
  Missing/empty links add no button spacing. Its anchor, width, padding, alignment
  and paragraph rendering remain unchanged. Empty or whitespace-only titles do not
  create an `h2`, including titles carrying preview annotations.
- The `desktop-download` block additionally accepts `downloadPlatform: "android"`.
  Android has a visible heading and the same disabled native button used by desktop
  platforms without an installer. The label comes from the locale dictionary:
  `Próximamente` / `Coming soon`. Architecture and custom button text do not apply
  to Android; stale desktop field values are ignored.
- Android is a presentation-only option. `desktopRelease`, upload actions, allowed
  installer formats, R2 object keys and release targets still cover Windows, macOS
  and Linux. Android never falls back to a Windows target or requests a desktop
  release. A future public Android release needs an explicit release/distribution
  contract and implementation before this block can offer a download.
- Current desktop targets and legacy Windows x64 defaults remain supported.
  Existing valid desktop downloads remain available. The release query still uses
  the published perspective, stable channel, exact platform/architecture and an
  installer URL. Whitespace-only custom button labels use the translated platform
  label, so available download links keep a visible name. No editorial switch is
  added to hide a valid release.
- `sanity/queries/section-header.ts` projects the optional array; the download query
  already projects platform/title/body/button fields. Types are maintained manually
  in this repository: no Sanity TypeGen config or generated schema/type artifact
  exists. `Sanity.DownloadPlatform` adds Android only to the presentation contract;
  `Sanity.Link.downloadPlatform` and desktop release types stay desktop-only.

## Configure drafts after the code is deployed and reviewed

These are manual editorial steps for a later authorized session. Keep the documents
in draft until explicit publication approval.

1. In Producto (`6b6ac7b2-2166-4c8e-9f8b-c798ebbc7148`), edit the existing Section
   Header (`f7bd11401eba`) titled “Encuentra la opción para tu instalación”. Keep
   Anchor ID `requisitos`, left alignment, width, color, title, description and
   padding. Add a Links item with Destination **URL**, title **Ver descargas**,
   href **/downloads**, the normal **Default** button variant, and same-tab
   navigation. The Spanish page resolves it to `/es/downloads`. Do not add a
   separate empty CTA. Leave the final CTA and its kiosk link unchanged.
2. In Descargas (`265d6751-8b5a-4064-93cc-be1fdf6b6390`), replace the temporary
   Android Section Header (`5e69d3081814`) with a **Desktop download** block in
   the same position. Select **Android · Próximamente**, set title **Android**,
   keep tagline **ANDROID · PRÓXIMAMENTE**, and put the existing description into
   Body: “Una opción para equipos Android compatibles. La descarga todavía no
   está disponible.” Match the neighboring download blocks' width, alignment,
   padding and button variant. No architecture, URL or APK is required. Remove
   the temporary header only after the replacement is complete to avoid duplicates.
3. Preserve the order **navegador web → Android → Windows → Linux**, the draft
   slug `downloads`, and the Recursos menu's draft `/downloads` reference. Confirm
   the heading and disabled button in preview, with desktop and mobile widths.
4. Keep all these edits in draft for approval. This code change does not publish
   either document or modify the navigation content.

## Local regression checks

Use Node `22.20.0` and npm `10.9.3`, as declared by the repository. After dependency
installation, generate Next's local route/image declarations with `npx next typegen`,
then run `npm run typecheck`, `npm run lint`, `npm run test:unit` and
`npm run test:downloads`.

The browser regression uses real components and site CSS with synthetic data. It
checks 320/375/768/1440 px, both themes, Spanish/English, available/unavailable
desktop downloads, Android's disabled state, headings, links, anchor navigation,
keyboard focus, order, spacing and horizontal overflow. It aborts non-local browser
requests and never opens Studio, the kiosk, or a backend. It writes screenshots and a report
to `output/playwright/downloads/`.

On a Windows sandbox, use a writable local `TEMP`/`TMP` directory for Vitest's
module cache and point `PLAYWRIGHT_BROWSERS_PATH` to the installed Chromium cache
if the sandbox's redirected user directory has no browser. Localhost access must
be permitted for the browser run. These settings affect only the test process.

A full Next production build can fetch CMS pages and Google Fonts; the isolated
component regression does not certify live CMS content or a deployed preview.
