import React from "react";
import { Download } from "lucide-react";
import { stegaClean } from "next-sanity";

import { Button, type ButtonProps } from "@/components/ui/button";

export type DesktopDownloadMessages = {
  comingSoon: string;
  defaultLabel: string;
};

export default function DesktopDownloadButton({
  release,
  title,
  variant,
  messages,
}: {
  release?: Sanity.DesktopRelease | null;
  title?: string;
  variant?: ButtonProps["variant"];
  messages: DesktopDownloadMessages;
}) {
  const installerUrl = release?.installer?.url;
  const label = stegaClean(title) || messages.defaultLabel;
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
