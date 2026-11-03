"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Monitor, Pause, Play } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { UiDictionary } from "@/i18n/dictionaries";
import type { HeroScene, ScreenSlide } from "@/lib/hero-screen";
import { RoomMotionContext, useStageVisibility } from "./room-motion";
import styles from "./screen.module.css";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(update: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}
const reducedMotion = () => window.matchMedia(motionQuery).matches;
const serverReducedMotion = () => true;
type LoadState = Record<string, "ready" | "failed">;
type Direction = 1 | -1;
type Playback = "auto" | "paused" | "playing" | "browsing";

function resolveSlide(
  slides: ScreenSlide[],
  key: string | null,
  direction: Direction,
  loads: LoadState,
) {
  const start = slides.findIndex((slide) => slide.key === key);
  if (start < 0) return slides.find((slide) => loads[slide.src] !== "failed");
  // An unsuccessful image is skipped in the direction the visitor was going.
  for (let offset = 0; offset < slides.length; offset++) {
    const slide =
      slides[(start + direction * offset + slides.length) % slides.length];
    if (loads[slide.src] !== "failed") return slide;
  }
}

export default function ScreenCarousel({
  sizes,
  slides,
  baseScene,
  messages,
  isFirstBlock,
  children,
}: {
  sizes: string;
  slides: ScreenSlide[];
  baseScene: HeroScene;
  messages: UiDictionary["heroScreen"];
  isFirstBlock: boolean;
  children: ReactNode;
}) {
  const [request, setRequest] = useState<{
    key: string | null;
    direction: Direction;
    manual: boolean;
  }>(() => ({ key: slides[0]?.key ?? null, direction: 1, manual: false }));
  const [loads, setLoads] = useState<LoadState>({});
  const [frames, setFrames] = useState<{
    front?: ScreenSlide;
    back?: ScreenSlide;
  }>({});
  const [playback, setPlayback] = useState<Playback>("auto");
  const [hovered, setHovered] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const inView = useStageVisibility(stage);
  const reduce = useSyncExternalStore(
    subscribeMotion,
    reducedMotion,
    serverReducedMotion,
  );

  const available = slides.filter((slide) => loads[slide.src] !== "failed");
  const requested = resolveSlide(slides, request.key, request.direction, loads);
  const requestedKey = requested?.key ?? null;
  if (requestedKey !== request.key)
    setRequest({ ...request, key: requestedKey });

  const ready = Boolean(requested && loads[requested.src] === "ready");
  if (
    requested &&
    ready &&
    (frames.front?.key !== requested.key || frames.front.src !== requested.src)
  ) {
    setFrames({ front: requested, back: frames.front });
  }
  // Keep the actual last decoded asset even when Studio replaces it under the same key.
  const visible =
    ready ||
    !requested ||
    !available.some((slide) => slide.key === frames.front?.key)
      ? requested
      : frames.front;
  const index = available.findIndex((slide) => slide.key === requestedKey);
  const visibleIndex = available.findIndex(
    (slide) => slide.key === visible?.key,
  );
  const multiple = available.length > 1;
  const next = multiple ? available[(index + 1) % available.length] : undefined;
  const nextKey = next?.key;
  const playing = playback === "playing" || (playback === "auto" && !reduce);

  useEffect(() => {
    if (!playing || hovered || !inView || !ready || !nextKey) return;
    const timer = window.setTimeout(
      () => setRequest({ key: nextKey, direction: 1, manual: false }),
      5000,
    );
    return () => window.clearTimeout(timer);
  }, [playing, hovered, inView, ready, requestedKey, nextKey]);

  function browse() {
    setPlayback((previous) => (previous === "paused" ? "paused" : "browsing"));
  }

  function navigate(direction: Direction) {
    const target =
      available[(index + direction + available.length) % available.length];
    browse();
    setRequest({ key: target.key, direction, manual: true });
  }

  function mark(src: string, status: LoadState[string]) {
    setLoads((last) =>
      last[src] === status ? last : { ...last, [src]: status },
    );
  }

  const layers = new Map<string, ScreenSlide>();
  for (const slide of [
    ready ? frames.back : undefined,
    visible,
    requested,
    ready ? next : undefined,
  ]) {
    if (slide) layers.set(slide.key + ":" + slide.src, slide);
  }
  const scene = visible?.scene ?? baseScene;
  const canAnimate =
    inView && visible && loads[visible.src] === "ready" && playback !== "paused";
  const roomMode = !canAnimate ? "paused" : playing && multiple ? "loop" : "once";
  const position = `${messages.template} ${visibleIndex + 1} ${messages.of} ${available.length}`;

  return (
    <div
      className={styles.carousel}
      role="group"
      aria-label={messages.label}
      aria-roledescription={multiple ? messages.carousel : undefined}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget) &&
          event.target.matches(":focus-visible")
        )
          browse();
      }}
    >
      <div className={styles.caption}>
        <span className={styles.sceneLabel}>
          <i aria-hidden="true" />
          {messages.scenes[scene]}
        </span>
        {multiple && (
          <div className={styles.controls}>
            <button
              type="button"
              aria-label={playing ? messages.pause : messages.play}
              onClick={() => setPlayback(playing ? "paused" : "playing")}
            >
              {playing ? (
                <Pause aria-hidden="true" />
              ) : (
                <Play aria-hidden="true" />
              )}
            </button>
            <span className={styles.count} aria-hidden="true">
              {String(visibleIndex + 1).padStart(2, "0")} /{" "}
              {String(available.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              aria-label={messages.previous}
              onClick={() => navigate(-1)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={messages.next}
              onClick={() => navigate(1)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <div ref={stage} className={styles.stage} data-scene={scene}>
        <RoomMotionContext.Provider
          value={{ scene, mode: roomMode, reduced: reduce }}
        >
          {children}
        </RoomMotionContext.Provider>
        <div className={styles.screen}>
          <div
            className={styles.glass}
            role={visible ? "group" : undefined}
            aria-roledescription={multiple ? messages.slide : undefined}
            aria-label={visible ? position : undefined}
          >
            {[...layers].map(([id, slide]) => {
              const active =
                slide.key === visible?.key && slide.src === visible.src;
              const leading =
                active && isFirstBlock && slide.key === slides[0]?.key;
              const preparingNext = !active && slide.key === next?.key;
              return (
                <div
                  key={id}
                  className={styles.frame}
                  data-visible={active}
                  aria-hidden={!active}
                >
                  <Image
                    src={slide.src}
                    alt={active ? slide.alt || position : ""}
                    fill
                    loading={active && !leading ? "lazy" : "eager"}
                    fetchPriority={leading ? "high" : preparingNext ? "low" : undefined}
                    sizes={sizes}
                    className="object-contain"
                    onLoad={() => mark(slide.src, "ready")}
                    onError={() => mark(slide.src, "failed")}
                  />
                </div>
              );
            })}
            {!visible && (
              <span className={styles.standby}>
                <Monitor aria-hidden="true" />
                {messages.standby}
              </span>
            )}
          </div>
        </div>
      </div>
      <span className="sr-only" role="status" aria-atomic="true">
        {request.manual && visible && ready
          ? `${position}. ${visible.alt}`
          : ""}
      </span>
    </div>
  );
}
