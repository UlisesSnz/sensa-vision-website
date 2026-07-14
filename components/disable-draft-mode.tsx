"use client";
import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { useIsPresentationTool } from "next-sanity/hooks";

export function DisableDraftMode({ label }: { label: string }) {
  const isPresentationTool = useIsPresentationTool();

  if (isPresentationTool !== false) {
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
