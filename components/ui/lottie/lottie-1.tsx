"use client";

import { cn } from "@/lib/utils";
import SectionContainer, {
  ISectionContainer,
  ISectionPadding,
} from "@/components/ui/section-container";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { stegaClean } from "next-sanity";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

// Standalone sizes (center, vertical, no-body) — 4:3 aspect
const LOTTIE_STANDALONE = {
  sm: { width: 200, height: 150 },
  md: { width: 320, height: 240 },
  lg: { width: 480, height: 360 },
  full: { width: 600, height: 450 },
} as const;

// Horizontal min-heights — lottieSize controls cell height when text is short
const LOTTIE_MIN_HEIGHTS: Record<string, number> = {
  sm: 150,
  md: 240,
  lg: 360,
  full: 450,
};

export default function Lottie1({
  padding,
  colorVariant,
  body,
  textPosition = "right",
  lottieFile,
  lottieSize = "md",
  lottieLoop = true,
  lottieAutoplay = true,
}: Partial<{
  padding: ISectionPadding;
  colorVariant: ISectionContainer["color"];
  body: any;
  textPosition: "left" | "right" | "center" | "top" | "bottom";
  lottieFile: {
    asset: {
      _id: string;
      url: string;
      mimeType: string;
    };
  };
  lottieSize: "sm" | "md" | "lg" | "full";
  lottieLoop: boolean;
  lottieAutoplay: boolean;
}>) {
  const color = stegaClean(colorVariant);
  const position = stegaClean(textPosition);
  const size = stegaClean(lottieSize) as keyof typeof LOTTIE_STANDALONE;
  const loop = stegaClean(lottieLoop);
  const autoplay = stegaClean(lottieAutoplay);

  const fileUrl = lottieFile?.asset?.url;
  const dims = LOTTIE_STANDALONE[size] || LOTTIE_STANDALONE.md;

  const isHorizontal = position === "left" || position === "right";
  const isCenter = position === "center";
  const lottieFirst =
    position === "right" || position === "bottom" || position === "center";

  if (!fileUrl) return null;

  // cover eliminates internal whitespace in lottie animations
  const lottieCommon = {
    src: fileUrl,
    loop: loop !== false,
    autoplay: autoplay !== false,
    layout: { fit: "cover" as const, align: [0.5, 0.5] as [number, number] },
  };

  const textBlock = body ? (
    <div className={cn(color === "primary" ? "text-background" : undefined)}>
      <PortableTextRenderer value={body} />
    </div>
  ) : null;

  // No body: lottie centered (standalone)
  if (!textBlock) {
    return (
      <SectionContainer color={color} padding={padding}>
        <div className="flex justify-center">
          <div
            className="overflow-hidden rounded-lg"
            style={{ width: dims.width, height: dims.height, maxWidth: "100%" }}
          >
            <DotLottieReact
              {...lottieCommon}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>
      </SectionContainer>
    );
  }

  // Center layout: lottie on top, text below
  if (isCenter) {
    return (
      <SectionContainer color={color} padding={padding}>
        <div className="flex flex-col items-center">
          <div
            className="overflow-hidden rounded-lg"
            style={{ width: dims.width, height: dims.height, maxWidth: "100%" }}
          >
            <DotLottieReact
              {...lottieCommon}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <div className="mt-6 max-w-[48rem]">{textBlock}</div>
        </div>
      </SectionContainer>
    );
  }

  // Horizontal layout — lottie fills entire grid cell (like split-column image)
  if (isHorizontal) {
    return (
      <SectionContainer color={color} padding={padding}>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div
            className={cn(
              "overflow-hidden rounded-lg",
              position === "left" ? "lg:order-1" : undefined,
            )}
            style={{ minHeight: LOTTIE_MIN_HEIGHTS[size] || LOTTIE_MIN_HEIGHTS.md }}
          >
            <DotLottieReact
              {...lottieCommon}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <div className="px-4 py-6 lg:px-16 xl:px-20 flex flex-col justify-center">
            {textBlock}
          </div>
        </div>
      </SectionContainer>
    );
  }

  // Vertical layout (top/bottom)
  return (
    <SectionContainer color={color} padding={padding}>
      {lottieFirst ? (
        <>
          <div className="flex justify-center">
            <div
              className="overflow-hidden rounded-lg"
              style={{
                width: dims.width,
                height: dims.height,
                maxWidth: "100%",
              }}
            >
              <DotLottieReact
                {...lottieCommon}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
          <div className="mt-6">{textBlock}</div>
        </>
      ) : (
        <>
          <div className="mb-6">{textBlock}</div>
          <div className="flex justify-center">
            <div
              className="overflow-hidden rounded-lg"
              style={{
                width: dims.width,
                height: dims.height,
                maxWidth: "100%",
              }}
            >
              <DotLottieReact
                {...lottieCommon}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
        </>
      )}
    </SectionContainer>
  );
}
