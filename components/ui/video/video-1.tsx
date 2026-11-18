import { cn } from "@/lib/utils";
import SectionContainer, {
  ISectionContainer,
  ISectionPadding,
} from "@/components/ui/section-container";
import PortableTextRenderer from "@/components/portable-text-renderer";
import ActionLinks from "@/components/ui/action-links";
import { stegaClean } from "next-sanity";
import type { DesktopDownloadMessages } from "@/components/ui/desktop-download-button";
import type { Locale } from "@/i18n/config";
import type { DesktopReleaseLookup } from "@/lib/desktop-release-content";
import AutoplayVideo from "./autoplay-video";
import { buildYouTubeEmbedUrl, extractYouTubeId } from "./video-utils";

export default function Video1({
  padding,
  colorVariant,
  body,
  textPosition = "right",
  videoType = "youtube",
  youtubeUrl,
  uploadedVideo,
  videoAspectRatio = "16/9",
  videoLoop = false,
  videoAutoplay = false,
  videoControls = true,
  links,
  desktopReleases,
  downloadMessages,
  locale = "es",
  mediaMessages = {
    youtubeTitle: "Video de YouTube",
    unsupportedVideo: "Tu navegador no admite la etiqueta de video.",
    missingVideo: "No hay un video configurado",
  },
}: Partial<{
  padding: ISectionPadding;
  colorVariant: ISectionContainer["color"];
  body: any;
  textPosition: "left" | "right" | "top" | "bottom";
  videoType: "youtube" | "upload";
  youtubeUrl: string;
  uploadedVideo: {
    asset: {
      _id: string;
      url: string;
      mimeType: string;
    };
  };
  videoAspectRatio: string;
  videoLoop: boolean;
  videoAutoplay: boolean;
  videoControls: boolean;
  links: (Sanity.Link | null)[];
  desktopReleases: DesktopReleaseLookup;
  downloadMessages: DesktopDownloadMessages;
  locale: Locale;
  mediaMessages: {
    youtubeTitle: string;
    unsupportedVideo: string;
    missingVideo: string;
  };
}>) {
  const color = stegaClean(colorVariant);
  const position = stegaClean(textPosition);
  const type = stegaClean(videoType);
  const aspect = stegaClean(videoAspectRatio);
  const loopVideo = stegaClean(videoLoop);
  const autoplayVideo = stegaClean(videoAutoplay) === true;
  const showControls = stegaClean(videoControls);

  const isHorizontal = position === "left" || position === "right";
  const videoFirst = position === "right" || position === "bottom";

  const youtubeId =
    type === "youtube" && youtubeUrl ? extractYouTubeId(youtubeUrl) : null;

  const videoUrl = type === "upload" ? uploadedVideo?.asset?.url : null;

  const aspectClass =
    aspect === "4/3"
      ? "aspect-[4/3]"
      : aspect === "1/1"
        ? "aspect-square"
        : "aspect-video";

  const videoInner =
    type === "youtube" && youtubeId ? (
      autoplayVideo ? (
        <AutoplayVideo
          type="youtube"
          youtubeId={youtubeId}
          loop={loopVideo === true}
          title={mediaMessages.youtubeTitle}
        />
      ) : (
        <iframe
          src={buildYouTubeEmbedUrl({
            youtubeId,
            loop: loopVideo === true,
            controls: showControls !== false,
          })}
          title={mediaMessages.youtubeTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
          loading="lazy"
        />
      )
    ) : type === "upload" && videoUrl ? (
      autoplayVideo ? (
        <AutoplayVideo
          type="upload"
          src={videoUrl}
          loop={loopVideo === true}
          unsupportedMessage={mediaMessages.unsupportedVideo}
        />
      ) : (
        <video
          src={videoUrl}
          controls={showControls !== false}
          loop={loopVideo === true}
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        >
          {mediaMessages.unsupportedVideo}
        </video>
      )
    ) : (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-sm">
          {mediaMessages.missingVideo}
        </span>
      </div>
    );

  const videoBlock = (
    <div className={cn("w-full rounded-lg overflow-hidden", aspectClass)}>
      {videoInner}
    </div>
  );

  const hasBody = Array.isArray(body) ? body.length > 0 : Boolean(body);
  const textBlock = hasBody ? (
    <div className={cn(color === "primary" ? "text-background" : undefined)}>
      <PortableTextRenderer value={body} locale={locale} />
      <ActionLinks
        links={links}
        desktopReleases={desktopReleases}
        downloadMessages={downloadMessages}
        locale={locale}
      />
    </div>
  ) : null;

  // No body: video centered
  if (!textBlock) {
    return (
      <SectionContainer color={color} padding={padding}>
        <div className="max-w-4xl mx-auto">
          {videoBlock}
          <ActionLinks
            align="center"
            links={links}
            desktopReleases={desktopReleases}
            downloadMessages={downloadMessages}
            locale={locale}
          />
        </div>
      </SectionContainer>
    );
  }

  // Horizontal layout — media and text center each other
  if (isHorizontal) {
    return (
      <SectionContainer color={color} padding={padding}>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div
            className={cn(
              "flex items-center",
              position === "left" ? "lg:order-1" : undefined,
            )}
          >
            <div
              className={cn("w-full rounded-lg overflow-hidden", aspectClass)}
            >
              {videoInner}
            </div>
          </div>
          <div className="min-w-0 px-4 py-6 lg:px-16 xl:px-20 flex flex-col justify-center">
            {textBlock}
          </div>
        </div>
      </SectionContainer>
    );
  }

  // Vertical layout (top/bottom)
  return (
    <SectionContainer color={color} padding={padding}>
      {videoFirst ? (
        <>
          {videoBlock}
          <div className="mt-6">{textBlock}</div>
        </>
      ) : (
        <>
          <div className="mb-6">{textBlock}</div>
          {videoBlock}
        </>
      )}
    </SectionContainer>
  );
}
