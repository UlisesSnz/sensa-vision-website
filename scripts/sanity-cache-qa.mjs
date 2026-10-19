import { getCliClient } from "sanity/cli";

// Deliberately fixed to synthetic staging data. Never accepts a production target.
const client = getCliClient({ apiVersion: "2026-10-01" }).withConfig({
  projectId: "e07b8hy0", dataset: "staging", useCdn: false, perspective: "published",
});
const [command, marker = `QA-${Date.now()}`] = process.argv.slice(2);
const paragraph = (text, key) => ({
  _type: "block", _key: key, style: "normal", markDefs: [],
  children: [{ _type: "span", _key: `${key}-text`, marks: [], text }],
});

if (command === "seed") {
  const transaction = client.transaction();
  for (const language of ["es", "en"]) {
    const localeMarker = `${marker}-${language}`;
    transaction.createIfNotExists({
      _id: `qa-cache-settings-${language}`, _type: "siteSettings", language,
      footerPadding: { top: true, bottom: true },
      headerNavigation: [
        { _key: "home", label: localeMarker, href: "/", target: false },
        { _key: "resources", label: language === "es" ? "Recursos" : "Resources", subLinks: [
          { _key: "downloads", label: "Descargas QA", href: "/descargas", target: false },
          { _key: "blog", label: "Blog", href: "/blog", target: false },
        ] },
        { _key: "industries", label: "Industrias", subLinks: ["uno", "dos", "tres", "cuatro"].map((name) => ({
          _key: name, label: `Industria ${name}`, href: "/descargas", target: false,
        })) },
      ],
    });
    for (const slug of ["index", "descargas"]) {
      transaction.createIfNotExists({
        _id: `qa-cache-page-${language}-${slug}`, _type: "page", language,
        title: `Sanity cache QA ${language}`, slug: { _type: "slug", current: slug },
        meta_title: "Staging QA", meta_description: "Synthetic cache validation", noindex: true,
        blocks: [{ _type: "hero-1", _key: "hero", title: `Staging ${slug}`,
          body: [paragraph("Contenido sintético para validar publicación e invalidación.", "intro")],
        }],
      });
    }
    transaction.createIfNotExists({
      _id: `qa-cache-post-${language}`, _type: "post", language,
      title: "Artículo QA", slug: { _type: "slug", current: "cache-qa" },
      meta_title: "Staging QA", meta_description: "Synthetic Portable Text validation", noindex: true,
      body: [paragraph("Contenido sintético del artículo QA.", "intro")],
    });
  }
  await transaction.commit();
  console.log(JSON.stringify({ operation: "seed", dataset: "staging", marker }));
} else if (command === "publish") {
  const document = await client.patch("qa-cache-settings-es")
    .set({ "headerNavigation[0].label": marker }).commit();
  console.log(JSON.stringify({ operation: "publish", marker, publishedAt: document._updatedAt, revision: document._rev }));
} else if (command === "draft") {
  const document = await client.getDocument("qa-cache-settings-es");
  const fields = Object.fromEntries(Object.entries(document).filter(([key]) => !["_rev", "_createdAt", "_updatedAt"].includes(key)));
  await client.createOrReplace({ ...fields, _id: "drafts.qa-cache-settings-es",
    headerNavigation: document.headerNavigation.map((item, index) => index ? item : { ...item, label: marker }),
  });
  console.log(JSON.stringify({ operation: "draft", marker }));
} else if (command === "remove-draft") {
  await client.delete("drafts.qa-cache-settings-es");
  console.log("Removed the synthetic staging draft");
} else if (command === "inspect") {
  const result = await client.fetch('*[_type == "siteSettings"]{_id,language,_updatedAt,headerNavigation[0]}', {}, { filterResponse: false });
  console.log(JSON.stringify({ dataset: "staging", result: result.result, syncTags: result.syncTags }));
} else {
  throw new Error("Use seed, publish [marker], draft [marker], remove-draft, or inspect");
}
