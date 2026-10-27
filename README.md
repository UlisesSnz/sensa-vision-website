# Sensa Vision website

A Next.js 16.3 website with Tailwind CSS, shadcn/ui, and Sanity CMS with Live Editing.

## Runtime and package manager

- Node.js `>=22.20 <23` (the repository `.nvmrc` pins `22.20.0`, required by a Sanity CLI dependency).
- npm `10.9.3`, declared in `package.json` as the only supported package manager.

Install and validate the project with:

```bash
npm ci
npm run check
```

Inter is bundled in `app/fonts/` and loaded with `next/font/local`; Geist Pixel
comes from the installed `geist` package. Builds do not fetch Google Fonts.
Keep the Inter license with the font when updating it. See
[`app/fonts/README.md`](app/fonts/README.md) for provenance and supported characters.

The pricing-card browser regression uses isolated fixtures and does not connect
to Sanity or require environment variables:

```bash
npx playwright install chromium
npm run test:pricing
```

It checks eight viewport widths (375, 768, 1023, 1024, 1180, 1279, 1280 and 1440 px),
both themes, single-line prices and billing periods, long and missing badges,
localized links and billing controls. Screenshots and
the JSON report are saved to `output/playwright/pricing/`.

The Split Row browser regression uses the product screenshot, local fonts, and real
components without connecting to Sanity:

```bash
npm run test:split
```

It checks five viewport widths (375, 768, 1024, 1280 and 1440 px), both themes,
Spanish/English links, complete images, layout variants, spacing and section anchors.
Screenshots and the report are saved to `output/playwright/split/`. See
[`docs/split-row.md`](docs/split-row.md) for the editor controls, compatibility contract,
and the later manual consolidation of the product draft.

To test the optional Split Column link in Sanity's real form components:

```bash
npm run test:split:studio
```

This isolated editor checks adding, editing, removing and reopening links, including
legacy empty values and read-only mode. It uses local browser storage and blocks
CMS access. Screenshots and results are saved to `output/playwright/split-editor/`.

[Docs](https://schemaui.com/docs) | [Components](https://schemaui.com/components) | [Demo](https://schemaui-starter.vercel.app/)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fserge-0v%2Fnext-js-sanity-starter&env=NEXT_PUBLIC_SITE_URL,NEXT_PUBLIC_SITE_ENV,NEXT_PUBLIC_SANITY_API_VERSION,NEXT_PUBLIC_SANITY_PROJECT_ID,NEXT_PUBLIC_SANITY_DATASET,SANITY_API_READ_TOKEN,RESEND_API_KEY,RESEND_AUDIENCE_ID&demo-title=Next.js%20Sanity%20Starter&demo-description=Next.js%20Sanity%20Starter%20by%20Schema%20UI&demo-url=https%3A%2F%2Fschemaui-starter.vercel.app)

This starter is a part of [Schema UI](https://schemaui.com) project, which is a collection of components for building websites with Sanity CMS.

You can clone the repository and start building your website with the components.

Create a new `Sanity project` at [sanity.io](https://www.sanity.io/manage).

Add `http://localhost:3000` to the `CORS Origins` in your Sanity project settings.

1. Clone the repository:

```bash
git clone git@github.com:serge-0v/next-js-sanity-starter.git
```

2. Rename the `example.env.local` file to `.env.local` and add your `Sanity project ID` to `NEXT_PUBLIC_SANITY_PROJECT_ID` and `development` dataset to `NEXT_PUBLIC_SANITY_DATASET` to the file.

```bash
cd next-js-sanity-starter
mv example.env.local .env.local
```

3. Create and copy token from the `API` section with Viewer permissions in your Sanity project settings.

4. Install the dependencies:

```bash
npm install
```

5. You can create a demo page with the following command (`production` is the default dataset name from Sanity):

```bash
npx sanity dataset import demo.tag.gz production
```

6. Start the development server:

```bash
npm run dev
```

6. Open the browser and go to `http://localhost:3000` to see the demo page.

7. Your Sanity admin is available at `http://localhost:3000/studio`.

8. Once you're ready to deploy your website, make sure you add live url to the `CORS Origins` in your Sanity project settings.

9. Deploy your website to Vercel by creating a new project and adding your `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` dataset to the environment variables.

All environment variables:

- `NEXT_PUBLIC_SITE_URL` - your website url. For example, `https://yourwebsite.com` without trailing slash.

- `NEXT_PUBLIC_SITE_ENV` - development or production. Used for metadata. For example, if you deploy and want to have staging website on subdomain `dev.yourwebsite.com` and don't want search engines to index it, you can set this variable to `development`.

- `NEXT_PUBLIC_SANITY_API_VERSION` - your Sanity API version. You don't have to use specific dates, any past or present date is valid, and today's date will always give you the latest version - no need to check release history. For example: `YYYY-MM-DD`.

- `NEXT_PUBLIC_SANITY_PROJECT_ID` - your Sanity project ID. For example, `abc12345`.

- `NEXT_PUBLIC_SANITY_DATASET` - your Sanity dataset name. For example, `production`.

- `SANITY_API_READ_TOKEN` - your Sanity read token for Next.js to fetch data.

- `SANITY_API_TOKEN` - write token used only to apply the one-time localization migration.

- `R2_ACCOUNT_ID` - private Cloudflare account identifier used to sign desktop release operations.

- `R2_ACCESS_KEY_ID` - private access key for an R2 object token scoped to the desktop releases bucket.

- `R2_SECRET_ACCESS_KEY` - private secret for the scoped R2 object token.

- `R2_BUCKET_NAME` - desktop release bucket name. Production uses `sensa-desktop-releases`.

- `R2_PUBLIC_BASE_URL` - public custom-domain base URL for immutable installer downloads, without a trailing slash.

- `ENABLED_LOCALES` - comma-separated public locales. Keep `es` during translation and use `es,en` only when the English content is approved.

- `RESEND_API_KEY` - your RESEND api key for the newsletter form.

- `RESEND_AUDIENCE_ID` - your RESEND audience id for the newsletter form to store contacts.

- `EMAILJS_SERVICE_ID` - your EmailJS service id for the reusable EmailJS form block.

- `EMAILJS_PUBLIC_KEY` - your EmailJS public key (`user_id`) for API requests.

- `EMAILJS_PRIVATE_KEY` - optional EmailJS private key (`accessToken`) for stronger API authentication.

- `EMAILJS_TEMPLATE_CONTACT` - template id used when `templateKey` is set to `contact` in Sanity.

- `EMAILJS_TEMPLATE_QUOTE` - template id used when `templateKey` is set to `quote` in Sanity.

- `EMAILJS_TEMPLATE_SUPPORT` - template id used when `templateKey` is set to `support` in Sanity.

## SensaVision Desktop releases

Windows, macOS, and Linux installers are uploaded directly from the Sanity Studio
browser to Cloudflare R2 using administrator-only multipart Server Actions. Each
Sanity release represents one operating-system/architecture target, so targets
can be published independently and reused by Hero, CTA, or download blocks. See
[`docs/desktop-releases-r2.md`](docs/desktop-releases-r2.md) for bucket CORS,
lifecycle, cache, security, release workflow, and production QA.

## EmailJS Template Starter

Use this as a base template in EmailJS for your `contact`, `quote`, or `support` forms.
You can point all three environment variables to the same template ID, or create one template per key.

Recommended subject:

```txt
New submission - {{form_name}}
```

Recommended HTML content:

```html
<h2>New form submission</h2>
<p><strong>Form:</strong> {{form_name}}</p>
<p><strong>Page:</strong> {{page_path}}</p>
<p><strong>Submitted at:</strong> {{submitted_at}}</p>

<hr />

<p><strong>Name:</strong> {{name}}</p>
<p><strong>Email:</strong> {{email}}</p>
<p><strong>Phone:</strong> {{phone}}</p>
<p><strong>Message:</strong></p>
<p>{{message}}</p>

<hr />

<p><strong>All fields:</strong></p>
<pre>{{all_fields}}</pre>
```

Available variables from the API route:

- `form_name`
- `page_path`
- `submitted_at`
- `all_fields`
- Every field configured in Sanity (examples: `name`, `email`, `phone`, `message`)

Example using one template for all keys:

```env
EMAILJS_TEMPLATE_CONTACT=template_xxxxxxx
EMAILJS_TEMPLATE_QUOTE=template_xxxxxxx
EMAILJS_TEMPLATE_SUPPORT=template_xxxxxxx
```

## Internationalization rollout

Spanish uses the `/es` prefix and English uses `/en`. The root URL only detects the preferred enabled locale, while legacy unprefixed content URLs permanently redirect to their `/es` equivalent. Public Sanity queries never fall back between languages.

Sanity Studio 6 uses Document Internationalization 6. Translation metadata stores the locale in each item's `language` field; `_key` is an independent item identifier. The migration script reads both formats and preserves existing keys and references when preparing translations.

Before applying the content migration, export a dataset backup and review the dry-run report:

```bash
npm run i18n:backup
npm run i18n:migrate:dry
```

The apply command requires a write-enabled `SANITY_API_TOKEN`, explicit backup confirmation, and creates English documents as drafts:

```bash
npm run i18n:migrate:apply
```

Deploy with `ENABLED_LOCALES=es` while translations are prepared. Draft Mode can still preview `/en`. Once every English document, internal link, and SEO field has been reviewed, deploy with `ENABLED_LOCALES=es,en`. Rollback only requires restoring `ENABLED_LOCALES=es` and redeploying.
