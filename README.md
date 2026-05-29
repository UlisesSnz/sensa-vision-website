# Next.js 15 with Sanity CMS Starter Template

A Next.js starter template with `Next.js 15`, `Tailwind CSS`, `shadcn/ui`, and `Sanity CMS` with `Live Editing`.

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
pnpm install
```

5. You can create a demo page with the following command (`produciton` is the default dataset name from Sanity):

```bash
pnpx sanity dataset import demo.tag.gz produciton
```

6. Start the development server:

```bash
pnpm dev
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

- `RESEND_API_KEY` - your RESEND api key for the newsletter form.

- `RESEND_AUDIENCE_ID` - your RESEND audience id for the newsletter form to store contacts.

- `EMAILJS_SERVICE_ID` - your EmailJS service id for the reusable EmailJS form block.

- `EMAILJS_PUBLIC_KEY` - your EmailJS public key (`user_id`) for API requests.

- `EMAILJS_PRIVATE_KEY` - optional EmailJS private key (`accessToken`) for stronger API authentication.

- `EMAILJS_TEMPLATE_CONTACT` - template id used when `templateKey` is set to `contact` in Sanity.

- `EMAILJS_TEMPLATE_QUOTE` - template id used when `templateKey` is set to `quote` in Sanity.

- `EMAILJS_TEMPLATE_SUPPORT` - template id used when `templateKey` is set to `support` in Sanity.

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
