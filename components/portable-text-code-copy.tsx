"use client";

import { useEffect, useRef, useState } from "react";
import type { UiDictionary } from "@/i18n/dictionaries";

export default function PortableTextCodeCopy({ code, messages }: {
  code: string;
  messages: UiDictionary["code"];
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timeout.current), []);

  async function copy() {
    clearTimeout(timeout.current);
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    timeout.current = setTimeout(() => setStatus("idle"), 3_000);
  }

  return (
    <div className="shrink-0">
      <button type="button" onClick={copy}
        className="min-h-10 rounded-md border px-3 text-xs font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        {status === "copied" ? messages.copied : messages.copy}
      </button>
      <span role="status" aria-live="polite" className={status === "error" ? "mt-2 block max-w-48 text-xs text-destructive" : "sr-only"}>
        {status === "copied" ? messages.copied : status === "error" ? messages.error : ""}
      </span>
    </div>
  );
}
