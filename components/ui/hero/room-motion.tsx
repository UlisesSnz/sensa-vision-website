"use client";

import type { AnimationItem } from "lottie-web";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type { HeroScene } from "@/lib/hero-screen";
import styles from "./screen.module.css";

const artwork = {
  office: () => import("./motion/office.json"),
  store: () => import("./motion/store.json"),
  pharmacy: () => import("./motion/pharmacy.json"),
  restaurant: () => import("./motion/restaurant.json"),
  window: () => import("./motion/window.json"),
  education: () => import("./motion/education.json"),
  manufacturing: () => import("./motion/manufacturing.json"),
  healthcare: () => import("./motion/healthcare.json"),
  home: () => import("./motion/home.json"),
} satisfies Record<HeroScene, () => Promise<unknown>>;

type Motion = {
  scene: HeroScene;
  playing: boolean;
  reduced: boolean;
};

export const RoomMotionContext = createContext<Motion>({
  scene: "office",
  playing: false,
  reduced: true,
});

export function useStageVisibility(ref: RefObject<HTMLDivElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;
    let inView = false;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(stage);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [ref]);
  return visible;
}

export function AnimatedRoom({
  scene,
  children,
}: {
  scene: HeroScene;
  children: ReactNode;
}) {
  const motion = useContext(RoomMotionContext);
  const canStart = motion.scene === scene && !motion.reduced && motion.playing;
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<AnimationItem | null>(null);
  const [ready, setReady] = useState<AnimationItem | null>(null);

  useEffect(() => {
    if (!canStart || instance.current) return;
    let cancelled = false;
    async function load() {
      const [{ default: lottie }, { default: drawing }] = await Promise.all([
        import("lottie-web/build/player/lottie_light"),
        artwork[scene](),
      ]);
      if (cancelled || !host.current) return;
      const item = lottie.loadAnimation({
        container: host.current,
        renderer: "svg",
        rendererSettings: { focusable: false },
        animationData: structuredClone(drawing),
        autoplay: false,
        loop: true,
      });
      item.setSubframe(false);
      instance.current = item;
      item.addEventListener("DOMLoaded", () => {
        if (instance.current === item) setReady(item);
      });
    }
    // The server-drawn detail remains visible if the player or its artwork cannot load.
    void load().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [canStart, scene]);

  useEffect(() => {
    return () => {
      instance.current?.destroy();
      instance.current = null;
    };
  }, []);

  useEffect(() => {
    if (canStart) ready?.play();
    else ready?.pause();
  }, [canStart, ready]);

  return (
    <div
      data-room={scene}
      data-active={motion.scene === scene}
      data-animated={Boolean(ready) && !motion.reduced}
    >
      {children}
      <div ref={host} className={styles.roomPlayer} />
    </div>
  );
}
