"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { ComponentProps } from "react";

export default function LottiePlayer(props: ComponentProps<typeof DotLottieReact>) {
  return <DotLottieReact {...props} />;
}
