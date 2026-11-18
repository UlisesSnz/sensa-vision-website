"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import { buildYouTubeEmbedUrl } from "./video-utils";

const motionQuery = "(prefers-reduced-motion: reduce)";
const youtubeApiSrc = "https://www.youtube.com/iframe_api";

type YouTubePlayer = {
  destroy: () => void;
  mute: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
};

type YouTubePlayerEvent = {
  data?: number;
  target: YouTubePlayer;
};

type YouTubeApi = {
  Player: new (
    element: HTMLIFrameElement,
    options: {
      events: {
        onAutoplayBlocked?: () => void;
        onReady: (event: YouTubePlayerEvent) => void;
        onStateChange: (event: YouTubePlayerEvent) => void;
      };
    },
  ) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeApi> | undefined;

function subscribeMotion(update: () => void) {
  if (!window.matchMedia) return () => {};

  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}

function getReducedMotion() {
  return window.matchMedia?.(motionQuery).matches ?? false;
}

function getServerReducedMotion() {
  // Never start media before the browser has evaluated the visitor preference.
  return true;
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    getReducedMotion,
    getServerReducedMotion,
  );
}

function useInView(ref: RefObject<Element | null>) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    if (!("IntersectionObserver" in window)) {
      const timer = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry?.isIntersecting ?? false);
    });
    observer.observe(target);

    return () => observer.disconnect();
  }, [ref]);

  return inView;
}

function loadYouTubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    const fail = () => {
      youtubeApiPromise = undefined;
      reject(new Error("Unable to load the YouTube IFrame API."));
    };

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) resolve(window.YT);
      else fail();
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${youtubeApiSrc}"]`,
    );
    if (existing) {
      existing.addEventListener("error", fail, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = youtubeApiSrc;
    script.async = true;
    script.addEventListener("error", fail, { once: true });
    document.head.append(script);
  });

  return youtubeApiPromise;
}

type AutoplayVideoProps =
  | {
      type: "upload";
      src: string;
      loop: boolean;
      unsupportedMessage: string;
    }
  | {
      type: "youtube";
      youtubeId: string;
      loop: boolean;
      title: string;
    };

export default function AutoplayVideo(props: AutoplayVideoProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const inView = useInView(targetRef);
  const reducedMotion = useReducedMotion();
  const canAutoplay = inView && !reducedMotion;

  return (
    <div ref={targetRef} className="w-full h-full">
      {props.type === "upload" ? (
        <AutoplayUploadVideo {...props} canAutoplay={canAutoplay} />
      ) : (
        <AutoplayYouTubeVideo {...props} canAutoplay={canAutoplay} />
      )}
    </div>
  );
}

function AutoplayUploadVideo({
  src,
  loop,
  unsupportedMessage,
  canAutoplay,
}: Extract<AutoplayVideoProps, { type: "upload" }> & {
  canAutoplay: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const automaticCommand = useRef<"play" | "pause" | null>(null);
  const manuallyPaused = useRef(false);
  const finished = useRef(false);
  const mutedForAutoplay = useRef(false);

  const pauseAutomatically = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.paused) return;

    automaticCommand.current = "pause";
    video.pause();
  }, []);

  const playAutomatically = useCallback(() => {
    const video = videoRef.current;
    if (
      !video ||
      manuallyPaused.current ||
      (!loop && finished.current)
    ) {
      return;
    }

    if (!mutedForAutoplay.current) {
      video.muted = true;
      mutedForAutoplay.current = true;
    }

    automaticCommand.current = "play";
    void video.play().catch(() => {
      if (automaticCommand.current === "play") {
        automaticCommand.current = null;
      }
    });
  }, [loop]);

  useEffect(() => {
    if (canAutoplay) playAutomatically();
    else pauseAutomatically();
  }, [canAutoplay, pauseAutomatically, playAutomatically]);

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      muted
      loop={loop}
      playsInline
      preload="metadata"
      className="w-full h-full object-cover"
      onEnded={() => {
        finished.current = true;
        automaticCommand.current = null;
      }}
      onPause={() => {
        if (automaticCommand.current === "pause") {
          automaticCommand.current = null;
          return;
        }
        if (!videoRef.current?.ended) manuallyPaused.current = true;
      }}
      onPlay={() => {
        if (automaticCommand.current === "play") {
          automaticCommand.current = null;
          return;
        }
        manuallyPaused.current = false;
        finished.current = false;
      }}
    >
      {unsupportedMessage}
    </video>
  );
}

function AutoplayYouTubeVideo({
  youtubeId,
  loop,
  title,
  canAutoplay,
}: Extract<AutoplayVideoProps, { type: "youtube" }> & {
  canAutoplay: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const playerReady = useRef(false);
  const playerInitializing = useRef(false);
  const automaticCommand = useRef<"play" | "pause" | null>(null);
  const manuallyPaused = useRef(false);
  const finished = useRef(false);
  const autoplayBlocked = useRef(false);
  const mutedForAutoplay = useRef(false);
  const canAutoplayRef = useRef(canAutoplay);
  const loopRef = useRef(loop);
  const [origin, setOrigin] = useState<string>();
  const [loadedSrc, setLoadedSrc] = useState<string>();

  useEffect(() => {
    canAutoplayRef.current = canAutoplay;
  }, [canAutoplay]);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    if (!canAutoplay || origin) return;

    const timer = window.setTimeout(
      () => setOrigin(window.location.origin),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [canAutoplay, origin]);

  const pauseAutomatically = useCallback((player = playerRef.current) => {
    if (!player || !playerReady.current) return;

    automaticCommand.current = "pause";
    player.pauseVideo();
  }, []);

  const playAutomatically = useCallback((player = playerRef.current) => {
    if (
      !player ||
      !playerReady.current ||
      !canAutoplayRef.current ||
      autoplayBlocked.current ||
      manuallyPaused.current ||
      (!loopRef.current && finished.current)
    ) {
      return;
    }

    if (!mutedForAutoplay.current) {
      player.mute();
      mutedForAutoplay.current = true;
    }

    automaticCommand.current = "play";
    player.playVideo();
  }, []);

  useEffect(() => {
    if (canAutoplay) playAutomatically();
    else pauseAutomatically();
  }, [canAutoplay, pauseAutomatically, playAutomatically]);

  const src = buildYouTubeEmbedUrl({
    youtubeId,
    loop,
    controls: true,
    enableJsApi: true,
    playsInline: true,
    origin,
  });
  const frameReady = loadedSrc === src;

  useEffect(() => {
    if (
      !canAutoplay ||
      !origin ||
      !frameReady ||
      !iframeRef.current ||
      playerRef.current ||
      playerInitializing.current
    ) {
      return;
    }

    let cancelled = false;
    playerInitializing.current = true;

    void loadYouTubeIframeApi()
      .then((youtube) => {
        if (cancelled || !iframeRef.current) {
          playerInitializing.current = false;
          return;
        }

        playerRef.current = new youtube.Player(iframeRef.current, {
          events: {
            onAutoplayBlocked: () => {
              autoplayBlocked.current = true;
              automaticCommand.current = null;
            },
            onReady: ({ target }) => {
              playerRef.current = target;
              playerReady.current = true;
              playerInitializing.current = false;
              playAutomatically(target);
            },
            onStateChange: ({ data }) => {
              if (data === 0) {
                finished.current = true;
                automaticCommand.current = null;
                return;
              }

              if (data === 1) {
                if (automaticCommand.current === "play") {
                  automaticCommand.current = null;
                  return;
                }
                manuallyPaused.current = false;
                finished.current = false;
                autoplayBlocked.current = false;
                return;
              }

              if (data === 2) {
                if (automaticCommand.current === "pause") {
                  automaticCommand.current = null;
                  return;
                }
                manuallyPaused.current = true;
              }
            },
          },
        });
      })
      .catch(() => {
        playerInitializing.current = false;
      });

    return () => {
      cancelled = true;
      if (!playerRef.current) playerInitializing.current = false;
    };
  }, [canAutoplay, frameReady, origin, playAutomatically]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
      playerReady.current = false;
    };
  }, []);

  return (
    <iframe
      key={src}
      ref={iframeRef}
      src={src}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="w-full h-full border-0"
      loading="lazy"
      onLoad={(event) => setLoadedSrc(event.currentTarget.src)}
    />
  );
}
