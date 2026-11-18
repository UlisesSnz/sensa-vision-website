import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { evaluate, parse } from "groq-js";
import { createSchema, validateDocument, type Workspace } from "sanity";
import { describe, expect, it, vi } from "vitest";

import ActionLinks from "@/components/ui/action-links";
import Lottie1 from "@/components/ui/lottie/lottie-1";
import Video1 from "@/components/ui/video/video-1";
import { getDictionary } from "@/i18n/dictionaries";
import { PAGE_QUERY } from "@/sanity/queries/page";
import lottie1 from "@/sanity/schemas/blocks/lottie/lottie-1";
import { buttonVariant } from "@/sanity/schemas/blocks/shared/button-variant";
import link from "@/sanity/schemas/blocks/shared/link";
import video1 from "@/sanity/schemas/blocks/video/video-1";
import { buildYouTubeEmbedUrl } from "@/components/ui/video/video-utils";

vi.mock("@/components/ui/lottie/lottie-player", () => ({
  default: ({ src }: { src?: string }) => <div data-lottie={src} />,
}));
vi.mock("@/sanity/env", () => ({
  projectId: "localqa",
  dataset: "local",
  apiVersion: "2024-10-31",
  useCdn: false,
}));

const downloadMessages = getDictionary("es").downloads;
const release: Sanity.DesktopRelease = {
  version: "1.2.3",
  releasedAt: "2026-01-01T00:00:00.000Z",
  channel: "stable",
  platform: "win32",
  architecture: "x64",
  installer: {
    objectKey: "desktop/stable/win32/x64/v1.2.3/test/SensaVision.exe",
    url: "https://downloads.example.test/SensaVision.exe",
    fileName: "SensaVision.exe",
    sizeBytes: 100,
    mimeType: "application/vnd.microsoft.portable-executable",
    etag: "test",
  },
};

const textBody = [
  {
    _type: "block",
    _key: "copy",
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: "copy-text",
        text: "Descubre cómo funciona Sensa Vision.",
        marks: [],
      },
    ],
  },
];

const mediaLinks = [
  {
    _key: "product",
    title: "Ver producto",
    href: "/producto",
    buttonVariant: "outline" as const,
  },
];

const mediaSchema = createSchema({
  name: "media-actions",
  types: [
    {
      name: "section-padding",
      type: "object",
      fields: [
        { name: "top", type: "boolean" },
        { name: "bottom", type: "boolean" },
      ],
    },
    { name: "color-variant", type: "string" },
    { name: "block-content", type: "array", of: [{ type: "block" }] },
    buttonVariant,
    link,
    video1,
    lottie1,
    {
      name: "mediaPage",
      type: "document",
      fields: [
        {
          name: "blocks",
          type: "array",
          of: [{ type: "video-1" }, { type: "lottie-1" }],
        },
      ],
    },
  ],
});

const workspace = {
  schema: mediaSchema,
  getClient: () => {
    throw new Error("Unexpected CMS access");
  },
} as unknown as Workspace;

async function validationPaths(blocks: object[]) {
  const markers = await validateDocument({
    workspace,
    getDocumentExists: async () => true,
    document: {
      _id: "media-actions",
      _type: "mediaPage",
      _rev: "1",
      _createdAt: "",
      _updatedAt: "",
      blocks,
    },
  });

  return markers
    .filter((marker) => marker.level === "error")
    .map((marker) => marker.path);
}

async function project(blocks: object[]) {
  const result = await evaluate(parse(PAGE_QUERY), {
    dataset: [
      {
        _id: "media-actions",
        _type: "page",
        language: "es",
        slug: { current: "media" },
        blocks,
      },
    ],
    params: { locale: "es", slug: "media" },
  });

  return (await result.get()).blocks;
}

describe("shared action links", () => {
  it("preserves localized, external, and variant-aware URL actions", () => {
    const html = renderToStaticMarkup(
      createElement(ActionLinks, {
        locale: "en",
        links: [
          ...mediaLinks,
          {
            _key: "external",
            title: "Open documentation",
            href: "https://example.test/docs",
            target: true,
            buttonVariant: "ghost",
          },
        ],
      }),
    );

    expect(html).toContain('href="/en/producto"');
    expect(html).toContain("border-input");
    expect(html).toContain('href="https://example.test/docs"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("hover:bg-accent");
  });

  it("uses the existing desktop download contract and omits invalid actions", () => {
    const available = renderToStaticMarkup(
      createElement(ActionLinks, {
        links: [
          { _key: "download", title: "Descargar", targetType: "desktopDownload" },
        ],
        desktopReleases: { "win32/x64": release },
        downloadMessages,
      }),
    );
    expect(available).toContain(`href="${release.installer.url}"`);

    const unavailable = renderToStaticMarkup(
      createElement(ActionLinks, {
        links: [
          { _key: "download", title: "Descargar", targetType: "desktopDownload" },
        ],
        downloadMessages,
      }),
    );
    expect(unavailable).toContain("disabled");
    expect(unavailable).toContain("Próximamente");

    const invalid = renderToStaticMarkup(
      createElement(ActionLinks, {
        links: [{ _key: "invalid", title: "Sin destino" }],
      }),
    );
    expect(invalid).toBe("");
  });
});

describe("media action placement", () => {
  it("centers actions after a standalone video, including an empty body array", () => {
    const html = renderToStaticMarkup(
      createElement(Video1, {
        videoType: "upload",
        uploadedVideo: {
          asset: {
            _id: "file-video",
            url: "https://cdn.example.test/demo.mp4",
            mimeType: "video/mp4",
          },
        },
        body: [],
        links: mediaLinks,
      }),
    );

    expect(html).toContain("justify-center");
    expect(html.indexOf("<video")).toBeLessThan(html.indexOf("Ver producto"));
  });

  it("keeps video actions with the body when copy is present", () => {
    const html = renderToStaticMarkup(
      createElement(Video1, {
        videoType: "upload",
        textPosition: "left",
        uploadedVideo: {
          asset: {
            _id: "file-video",
            url: "https://cdn.example.test/demo.mp4",
            mimeType: "video/mp4",
          },
        },
        body: textBody,
        links: mediaLinks,
      }),
    );

    expect(html).toContain("lg:grid-cols-2");
    expect(html.indexOf("Descubre cómo funciona")).toBeLessThan(
      html.indexOf("Ver producto"),
    );
  });

  it("centers actions after a standalone Lottie animation", () => {
    const html = renderToStaticMarkup(
      createElement(Lottie1, {
        lottieFile: {
          asset: {
            _id: "file-lottie",
            url: "https://cdn.example.test/demo.lottie",
            mimeType: "application/json",
          },
        },
        body: [],
        links: mediaLinks,
      }),
    );

    expect(html).toContain("justify-center");
    expect(html.indexOf("data-lottie")).toBeLessThan(html.indexOf("Ver producto"));
  });
});

describe("media frame radius", () => {
  const uploadedVideo = {
    asset: {
      _id: "file-video",
      url: "https://cdn.example.test/demo.mp4",
      mimeType: "video/mp4",
    },
  };
  const lottieFile = {
    asset: {
      _id: "file-lottie",
      url: "https://cdn.example.test/demo.lottie",
      mimeType: "application/json",
    },
  };

  it("uses the editorial media radius in every Video layout", () => {
    const markups = [
      renderToStaticMarkup(
        createElement(Video1, { videoType: "upload", uploadedVideo, body: [] }),
      ),
      renderToStaticMarkup(
        createElement(Video1, {
          videoType: "upload",
          uploadedVideo,
          body: textBody,
          textPosition: "left",
        }),
      ),
      renderToStaticMarkup(
        createElement(Video1, {
          videoType: "upload",
          uploadedVideo,
          body: textBody,
          textPosition: "top",
        }),
      ),
      renderToStaticMarkup(
        createElement(Video1, {
          videoType: "upload",
          uploadedVideo,
          body: textBody,
          textPosition: "bottom",
        }),
      ),
    ];

    for (const markup of markups) {
      expect(markup).toContain(
        'class="w-full overflow-hidden rounded-2xl aspect-video"',
      );
      expect(markup).not.toContain("rounded-lg");
    }
  });

  it("uses the editorial media radius in every Lottie layout", () => {
    const markups = [
      renderToStaticMarkup(createElement(Lottie1, { lottieFile, body: [] })),
      renderToStaticMarkup(
        createElement(Lottie1, {
          lottieFile,
          body: textBody,
          textPosition: "center",
        }),
      ),
      renderToStaticMarkup(
        createElement(Lottie1, {
          lottieFile,
          body: textBody,
          textPosition: "left",
        }),
      ),
      renderToStaticMarkup(
        createElement(Lottie1, {
          lottieFile,
          body: textBody,
          textPosition: "top",
        }),
      ),
      renderToStaticMarkup(
        createElement(Lottie1, {
          lottieFile,
          body: textBody,
          textPosition: "bottom",
        }),
      ),
    ];

    for (const markup of markups) {
      expect(markup).toContain("overflow-hidden rounded-2xl");
      expect(markup).not.toContain("rounded-lg");
    }
  });
});

describe("standalone video width", () => {
  const uploadedVideo = {
    asset: {
      _id: "file-video",
      url: "https://cdn.example.test/demo.mp4",
      mimeType: "video/mp4",
    },
  };

  it("preserves the contained width for existing video documents", () => {
    const html = renderToStaticMarkup(
      createElement(Video1, {
        videoType: "upload",
        uploadedVideo,
      }),
    );

    expect(html).toContain('class="max-w-4xl mx-auto"');
  });

  it("uses the full section container for newly configured standalone videos", () => {
    const html = renderToStaticMarkup(
      createElement(Video1, {
        videoType: "upload",
        uploadedVideo,
        sectionWidth: "default",
        links: mediaLinks,
      }),
    );

    expect(html).toContain('class="w-full"');
    expect(html).not.toContain("max-w-4xl");
    expect(html).toContain("justify-center");
  });

  it("does not constrain videos that already have companion text", () => {
    const html = renderToStaticMarkup(
      createElement(Video1, {
        videoType: "upload",
        uploadedVideo,
        body: textBody,
        textPosition: "bottom",
        sectionWidth: "narrow",
      }),
    );

    expect(html).toContain('class="mt-6"');
    expect(html).not.toContain("max-w-4xl");
  });
});

describe("Video and Lottie editorial links", () => {
  it("uses the established Links field convention", () => {
    for (const block of [video1, lottie1]) {
      const linksField = block.fields?.find((field) => field.name === "links");

      expect(linksField).toMatchObject({
        name: "links",
        type: "array",
        of: [{ type: "link" }],
      });
      expect(linksField).not.toHaveProperty("title");
      expect(linksField).not.toHaveProperty("description");
    }
  });

  it("allows up to two actions and rejects a third for both blocks", async () => {
    expect(mediaSchema.get("mediaPage")).toBeTruthy();
    const twoLinks = ["one", "two"].map((key) => ({
      _type: "link",
      _key: key,
      title: key,
      href: `/${key}`,
    }));
    const threeLinks = [...twoLinks, {
      _type: "link",
      _key: "three",
      title: "three",
      href: "/three",
    }];
    const validBlocks = [
      { _type: "video-1", _key: "video", links: twoLinks },
      {
        _type: "lottie-1",
        _key: "lottie",
        lottieFile: { _type: "file", asset: { _ref: "file-lottie" } },
        links: twoLinks,
      },
    ];

    expect(await validationPaths(validBlocks)).toEqual([]);

    const errors = await validationPaths([
      { ...validBlocks[0], links: threeLinks },
      { ...validBlocks[1], links: threeLinks },
    ]);
    expect(errors).toContainEqual(["blocks", { _key: "video" }, "links"]);
    expect(errors).toContainEqual(["blocks", { _key: "lottie" }, "links"]);
  });

  it("projects editorial links for both media blocks", async () => {
    const blocks = await project([
      {
        _type: "video-1",
        _key: "video",
        links: mediaLinks,
        videoAutoplay: true,
        sectionWidth: "default",
      },
      {
        _type: "lottie-1",
        _key: "lottie",
        lottieFile: { asset: { _ref: "file-lottie" } },
        links: mediaLinks,
      },
    ]);

    expect(blocks).toMatchObject([
      {
        _type: "video-1",
        _key: "video",
        links: mediaLinks,
        videoAutoplay: true,
        sectionWidth: "default",
      },
      { _type: "lottie-1", _key: "lottie", links: mediaLinks },
    ]);
  });
});

describe("video autoplay", () => {
  it("keeps autoplay opt-in in the editor and explains its playback precedence", () => {
    const autoplay = video1.fields?.find(
      (field) => field.name === "videoAutoplay",
    );
    const loop = video1.fields?.find((field) => field.name === "videoLoop");
    const controls = video1.fields?.find(
      (field) => field.name === "videoControls",
    );

    expect(autoplay).toMatchObject({
      name: "videoAutoplay",
      title: "Autoplay",
      type: "boolean",
      initialValue: false,
    });
    expect(autoplay?.description).toContain("muted");
    expect(loop?.description).toContain("after playback has started");
    expect(controls?.description).toContain("always shown with autoplay");
  });

  it("keeps existing uploaded videos manual and makes autoplay videos muted with controls", () => {
    const manual = renderToStaticMarkup(
      createElement(Video1, {
        videoType: "upload",
        videoControls: false,
        uploadedVideo: {
          asset: {
            _id: "file-video",
            url: "https://cdn.example.test/demo.mp4",
            mimeType: "video/mp4",
          },
        },
      }),
    );
    const autoplay = renderToStaticMarkup(
      createElement(Video1, {
        videoType: "upload",
        videoAutoplay: true,
        videoControls: false,
        uploadedVideo: {
          asset: {
            _id: "file-video",
            url: "https://cdn.example.test/demo.mp4",
            mimeType: "video/mp4",
          },
        },
      }),
    );

    expect(manual).toContain("<video");
    expect(manual).not.toContain("controls");
    expect(manual).not.toContain("autoplay");
    expect(autoplay).toContain("<video");
    expect(autoplay).toContain("controls");
    expect(autoplay).toContain("muted");
    expect(autoplay).not.toContain("autoplay");
  });

  it("prepares autoplay YouTube embeds for the visible, muted player API flow", () => {
    const src = buildYouTubeEmbedUrl({
      youtubeId: "video-id",
      loop: true,
      controls: true,
      enableJsApi: true,
      playsInline: true,
    });
    const html = renderToStaticMarkup(
      createElement(Video1, {
        videoType: "youtube",
        youtubeUrl: "https://www.youtube.com/watch?v=video-id",
        videoAutoplay: true,
        videoControls: false,
        videoLoop: true,
      }),
    );

    expect(src).toContain("loop=1");
    expect(src).toContain("playlist=video-id");
    expect(src).toContain("enablejsapi=1");
    expect(src).toContain("playsinline=1");
    expect(html).toContain("enablejsapi=1");
    expect(html).toContain("playsinline=1");
    expect(html).not.toContain("controls=0");
  });
});

describe("video standalone width editor control", () => {
  it("reuses the section-width options and only appears without companion text", () => {
    const width = video1.fields?.find(
      (field) => field.name === "sectionWidth",
    );
    const hidden = width && "hidden" in width ? width.hidden : undefined;

    expect(width).toMatchObject({
      name: "sectionWidth",
      title: "Section width",
      type: "string",
      initialValue: "default",
      options: {
        layout: "radio",
        list: [
          { title: "Default", value: "default" },
          { title: "Narrow", value: "narrow" },
        ],
      },
    });
    if (typeof hidden !== "function")
      throw new Error("Missing standalone-video width visibility rule");

    expect(
      hidden({ parent: { body: [] } } as Parameters<typeof hidden>[0]),
    ).toBe(false);
    expect(
      hidden({ parent: { body: textBody } } as Parameters<typeof hidden>[0]),
    ).toBe(true);
  });
});
