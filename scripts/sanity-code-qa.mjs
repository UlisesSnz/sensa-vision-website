import { getCliClient } from "sanity/cli";
import { codeFixture } from "../tests/fixtures/portable-text-code.ts";
import { codeLanguages } from "../lib/portable-text-code.ts";

// All fixtures are synthetic and restricted to staging, including media.
const client = getCliClient({ apiVersion: "2026-10-01" }).withConfig({
  projectId: "e07b8hy0", dataset: "staging", useCdn: false,
});
const filename = "qa-code-motion.json";
let asset = await client.fetch('*[_type == "sanity.fileAsset" && originalFilename == $filename][0]', { filename });
if (!asset) {
  const animation = { v: "5.7.4", fr: 30, ip: 0, op: 60, w: 200, h: 200, nm: "Synthetic QA", ddd: 0, assets: [],
    layers: [{ ddd: 0, ind: 1, ty: 1, nm: "QA Square", sr: 1, sw: 80, sh: 80, sc: "#6366f1",
      ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [40, 40, 0] }, s: { a: 0, k: [100, 100, 100] } }, ip: 0, op: 60, st: 0, bm: 0 }],
  };
  asset = await client.assets.upload("file", Buffer.from(JSON.stringify(animation)), { filename, contentType: "application/json" });
}
const paragraph = text => ({ _type: "block", _key: "intro", style: "normal", markDefs: [],
  children: [{ _type: "span", _key: "text", marks: [], text }],
});
const padding = { top: true, bottom: true };
const body = name => [codeFixture({ _key: `code-${name}`, filename: `${name}.ts` })];
const ref = (id, key) => ({ _type: "reference", _ref: id, _key: key });
const transaction = client.transaction();
for (const language of ["es", "en"]) {
  const longCode = `const longLine = "${"scroll local ".repeat(30)}";\n` + Array.from({ length: 35 }, (_, i) => `console.log(${i});`).join("\n");
  transaction.createOrReplace({ _id: `qa-code-faq-${language}`, _type: "faq", language,
    title: "FAQ con código", body: body("faq") });
  for (let index = 0; index < 3; index++) transaction.createOrReplace({
    _id: `qa-code-testimonial-${language}-${index}`, _type: "testimonial", language,
    name: `QA ${index + 1}`, title: "Carrusel con código", rating: 5,
    body: [codeFixture({ filename: "carousel.ts", code: longCode })],
  });
  transaction.createOrReplace({ _id: `qa-code-page-${language}`, _type: "page", language,
    title: "Código Portable Text QA", slug: { _type: "slug", current: "code-qa" }, noindex: true,
    blocks: [
      { _type: "hero-1", _key: "hero", title: "Código en Portable Text", padding,
        body: [paragraph("Contenido sintético de aceptación"), codeFixture({ code: longCode, filename: "long-code.ts" })] },
      { _type: "grid-row", _key: "grid", padding, gridColumns: "grid-cols-3", columns: [
        { _type: "grid-card", _key: "card", title: "Tarjeta enlazada", excerpt: body("card"),
          link: { _type: "link", title: "Ver artículo QA", href: "/blog/code-qa", buttonVariant: "default" } },
      ] },
      { _type: "faqs", _key: "faqs", padding, faqs: [ref(`qa-code-faq-${language}`, "faq")] },
      { _type: "carousel-2", _key: "carousel", padding,
        testimonial: [0, 1, 2].map(index => ref(`qa-code-testimonial-${language}-${index}`, `t${index}`)) },
      { _type: "video-1", _key: "video", padding, textPosition: "right", videoType: "youtube",
        youtubeUrl: "https://www.youtube.com/watch?v=qa-synthetic", videoControls: true, body: body("video") },
      { _type: "lottie-1", _key: "lottie", padding, textPosition: "right", lottieSize: "md",
        lottieFile: { _type: "file", asset: ref(asset._id, "asset") }, lottieLoop: true, lottieAutoplay: true, body: body("lottie") },
      { _type: "timeline-row", _key: "timeline", padding, timelines: [
        { _type: "timelines-1", _key: "entry", title: "Timeline QA", tagLine: "2026", body: body("timeline") },
      ] },
      { _type: "cta-1", _key: "cta", padding, title: "CTA QA", body: body("cta") },
      { _type: "split-row", _key: "split", padding, splitColumns: [
        { _type: "split-column", _key: "column", title: "Split QA", body: body("split") },
      ] },
    ],
  });
  transaction.createOrReplace({ _id: `qa-code-post-${language}`, _type: "post", language,
    title: "Artículo con código QA", slug: { _type: "slug", current: "code-qa" }, noindex: true,
    body: [paragraph("Lenguajes y contenido literal"), ...codeLanguages.map(({ value }) =>
      codeFixture({ _key: `code-${value}`, language: value, filename: `${value}.txt` })),
      codeFixture({ _key: "unknown", language: "unknown-language", filename: "literal.html",
        code: '<script>alert("literal")</script>\n<img src=x onerror=alert(1)>\n  whitespace  \n' }),
    ],
  });
}
await transaction.commit();
console.log("Synthetic code fixtures published in staging (es/en).");
