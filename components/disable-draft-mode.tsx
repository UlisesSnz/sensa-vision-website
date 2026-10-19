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
    <form action="/api/draft-mode/disable" method="get" className="fixed bottom-4 right-4">
      <Button type="submit">{label}</Button>
    </form>
  );
}
