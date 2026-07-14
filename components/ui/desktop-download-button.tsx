import React from "react";
import { Download } from "lucide-react";
import { stegaClean } from "next-sanity";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  DEFAULT_DESKTOP_RELEASE_TARGET,
  getDesktopReleaseTargetKey,
  type DesktopReleaseTarget,
  type DesktopReleaseTargetKey,
} from "@/lib/desktop-release";

export type DesktopDownloadMessages = {
  comingSoon: string;
  defaultLabels: Record<DesktopReleaseTargetKey, string>;
};

export default function DesktopDownloadButton({
  release,
  title,
  variant,
  messages,
  target = DEFAULT_DESKTOP_RELEASE_TARGET,
}: {
  release?: Sanity.DesktopRelease | null;
  title?: string;
  variant?: ButtonProps["variant"];
  messages: DesktopDownloadMessages;
  target?: DesktopReleaseTarget;
}) {
  const installerUrl = release?.installer?.url;
  const label =
    stegaClean(title) || messages.defaultLabels[getDesktopReleaseTargetKey(target)];
  const buttonVariant = stegaClean(variant);

  if (!installerUrl) {
    return (
      <Button disabled variant={buttonVariant}>
        <Download aria-hidden="true" />
        {messages.comingSoon}
      </Button>
    );
  }

  return (
    <Button asChild variant={buttonVariant}>
      <a download href={installerUrl} rel="noopener noreferrer">
        <Download aria-hidden="true" />
        {label}
      </a>
    </Button>
  );
}
