"use client";
import * as React from "react";

import { Button } from "@/components/ui/button";

import { useIsPresentationTool } from "next-sanity/hooks";

export function DisableDraftMode({ label }: { label: string }) {
  const isPresentationTool = useIsPresentationTool();

  if (isPresentationTool !== false) {
    return null;
  }

  return (
    <Button asChild>
      <a href="/api/draft-mode/disable" className="fixed bottom-4 right-4">
        {label}
      </a>
    </Button>
  );
}
