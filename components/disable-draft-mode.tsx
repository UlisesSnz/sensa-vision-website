"use client";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { useDraftModeEnvironment } from "next-sanity/hooks";

export function DisableDraftMode({ label }: { label: string }) {
  const environment = useDraftModeEnvironment();

  if (environment !== "live" && environment !== "unknown") {
    return null;
  }

  return (
    <Button asChild>
      <Link href="/api/draft-mode/disable" className="fixed bottom-4 right-4">
        {label}
      </Link>
    </Button>
  );
}
