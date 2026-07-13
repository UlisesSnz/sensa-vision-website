"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

type CopyLinkButtonProps = {
  className?: string;
  url: string;
  copyLabel: string;
  copiedLabel: string;
};

export default function CopyLinkButton({
  className,
  url,
  copyLabel,
  copiedLabel,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 2000);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copyUrl = async () => {
    try {
      const shareUrl = new URL(url, window.location.origin).toString();

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      aria-label={copied ? copiedLabel : copyLabel}
      className={cn(className)}
      onClick={copyUrl}
      title={copied ? copiedLabel : copyLabel}
      type="button"
    >
      {copied ? <Check size={24} /> : <Copy size={24} />}
    </button>
  );
}
