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

The application accepts `.exe`, `.msi`, and `.msix` files up to 5 GiB. It uses
16 MiB parts, at most three concurrent uploads, and signed URLs valid for 60
minutes. Completed objects use immutable keys and are never overwritten.

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
3. Enter a SemVer version and release date. Channel, platform, and architecture
   remain fixed to `stable`, `win32`, and `x64`.
4. Select the installer. If the browser is refreshed, select the same file to
   resume the multipart session. A different file requires cancelling the
   pending session first.
5. After R2 verifies the final size, save the metadata on the draft. Publish the
   document manually to expose it on the website.

Draft releases are never used by the public query. The newest published release
by `releasedAt` feeds the Hero, CTA, and Desktop download block.

## Production QA checklist

- Upload an installer through Studio using the test bucket first; retry a part,
  reload Studio, reselect the file, and verify the upload resumes.
- Cancel a second upload and confirm that its multipart session disappears.
- Confirm an editor token, invalid token, and missing session cannot sign or
  abort an upload.
- Publish the release and check both Spanish and English pages.
- Run `HEAD` against the custom-domain URL and verify `Content-Disposition`,
  `Cache-Control`, `Content-Type`, `ETag`, and the expected content length.
- Download the installer from the custom domain and compare its checksum and
  byte size with the original file.
- Confirm the custom domain is cached by Cloudflare and the production
  `r2.dev` endpoint is disabled.
