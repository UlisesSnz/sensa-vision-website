export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1);
    }
    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com"
    ) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      const embedMatch = parsed.pathname.match(/^\/embed\/([^/]+)/);
      if (embedMatch) return embedMatch[1];
      const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/]+)/);
      if (shortsMatch) return shortsMatch[1];
    }
  } catch {
    return null;
  }
  return null;
}

export function buildYouTubeEmbedUrl({
  youtubeId,
  loop,
  controls,
  enableJsApi = false,
  playsInline = false,
  origin,
}: {
  youtubeId: string;
  loop: boolean;
  controls: boolean;
  enableJsApi?: boolean;
  playsInline?: boolean;
  origin?: string;
}) {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${youtubeId}`);

  url.searchParams.set("loop", loop ? "1" : "0");
  if (loop) url.searchParams.set("playlist", youtubeId);
  if (!controls) url.searchParams.set("controls", "0");
  if (enableJsApi) url.searchParams.set("enablejsapi", "1");
  if (playsInline) url.searchParams.set("playsinline", "1");
  if (origin) url.searchParams.set("origin", origin);

  return url.toString();
}
