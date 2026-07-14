# SensaVision Desktop releases in Cloudflare R2

The website stores only release metadata in Sanity. Installer bytes travel
directly from the administrator's browser to the private R2 API through signed
multipart URLs. Next.js authenticates the Sanity user, coordinates multipart
operations, and never proxies the installer body.

## Production resources

1. Create the R2 Standard bucket `sensa-desktop-releases`.
2. Connect a custom domain such as `downloads.example.com` and set its value in
   `R2_PUBLIC_BASE_URL` without a trailing slash.
3. Disable the bucket's public `r2.dev` URL in production.
4. Create an R2 API token with object read/write permissions scoped only to this
   bucket. It must not have account-wide administrative permissions.
5. Add the five private environment variables to local development and every
   Vercel environment that hosts Studio:

   ```env
   R2_ACCOUNT_ID=
   R2_ACCESS_KEY_ID=
   R2_SECRET_ACCESS_KEY=
   R2_BUCKET_NAME=sensa-desktop-releases
   R2_PUBLIC_BASE_URL=https://downloads.example.com
   ```

Each release document represents one operating-system and architecture target.
Targets are independent: publishing Windows does not require macOS or Linux to
exist, and each target can have its own version and release date.

Supported targets and formats are:

- Windows x64/ARM64: `.exe`, `.msi`, `.msix`.
- macOS Intel/Apple Silicon/Universal: `.dmg`, `.pkg`, `.zip`.
- Linux x64/ARM64: `.AppImage`, `.deb`, `.rpm`, `.tar.gz`.

Files can weigh up to 5 GiB. Uploads use 16 MiB parts, at most three concurrent
requests, and signed URLs valid for 60 minutes. Completed objects use immutable
keys under `desktop/stable/{platform}/{architecture}/v{version}/` and are never
overwritten. Previously published Windows x64 keys and URLs remain valid.

## Bucket CORS

Replace the production origin before applying this policy. Do not add wildcard
origins.

```json
[
  {
    "AllowedOrigins": [
      "https://www.example.com",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

The public website only performs `GET` requests through the custom download
domain; those requests do not require browser CORS access.

## Lifecycle and cache

- Add a lifecycle rule that aborts incomplete multipart uploads after seven
  days. This is a safety net for browser sessions that were never cancelled.
- Do not add expiration rules for completed objects. A published Sanity release
  must always keep its immutable download URL valid.
- The multipart creation request stores
  `Cache-Control: public, max-age=31536000, immutable` and
  `Content-Disposition: attachment` on the completed object.
- Add a Cloudflare cache rule for the downloads hostname with cache eligibility
  enabled and origin cache-control respected. Scope the expression to that
  hostname only.

## Sanity release workflow

1. Sign into `/studio` using an administrator token.
2. Open **Desktop releases** and create a document.
3. Enter a SemVer version and release date, then select the operating system and
   architecture. The channel remains fixed to `stable`.
4. Select the installer. Studio restricts the file picker and validation to the
   formats supported by that operating system. If the browser is refreshed,
   select the same file to
   resume the multipart session. A different file requires cancelling the
   pending session first.
5. After R2 verifies the final size, save the metadata on the draft. Publish the
   document manually to expose it on the website.

The operating system and architecture are locked after an installer is attached
so the document cannot point at a binary for a different target. Replacing the
binary keeps the same target.

Draft releases are never used by public queries. Each Hero, CTA link, or Desktop
download block selects a target editorially and resolves only its newest
published release by `releasedAt`. Existing content without target fields keeps
using Windows x64. A target without a published release renders a disabled
localized "coming soon" button.

## Production QA checklist

- In a test dataset and bucket, create independent Windows, macOS, and Linux
  releases. Publish them progressively and confirm that no target is required by
  another.
- Upload an installer for each operating system; retry a part, reload Studio,
  reselect the file, and verify the upload resumes for the same document.
- Cancel a second upload and confirm that its multipart session disappears.
- Confirm an editor token, invalid token, and missing session cannot sign or
  abort an upload.
- Configure different targets in a Hero, CTA, and Desktop download block, then
  check both Spanish and English pages.
- Run `HEAD` against the custom-domain URL and verify `Content-Disposition`,
  `Cache-Control`, `Content-Type`, `ETag`, and the expected content length.
- Download the installer from the custom domain and compare its checksum and
  byte size with the original file.
- Confirm the custom domain is cached by Cloudflare and the production
  `r2.dev` endpoint is disabled.
