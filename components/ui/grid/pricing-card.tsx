"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface FeatureGroup {
  category: string;
  features: string[];
}

interface PricingTier {
  label: string;
  price: string;
  discount?: string;
  annualPrice?: string;
  annualDiscount?: string;
}

interface PricingCardProps {
  color:
    | "primary"
    | "secondary"
    | "card"
    | "accent"
    | "destructive"
    | "background"
    | "transparent";
  title: string;
  tagLine: string;
  excerpt: string;
  price: {
    value: number;
    period: string;
    annualLabel?: string;
  };
  featureGroups?: FeatureGroup[];
  pricingTiers?: PricingTier[];
  list: string[];
  image: Sanity.Image;
  link?: {
    title: string;
    href: string;
    target?: boolean;
    buttonVariant:
      | "default"
      | "secondary"
      | "link"
      | "destructive"
      | "outline"
      | "ghost"
      | null
      | undefined;
  };
}

export default function PricingCard({
  color,
  title,
  tagLine,
  excerpt,
  price,
  featureGroups,
  pricingTiers,
  list,
  link,
}: PricingCardProps) {
  const hasFeatureGroups = featureGroups && featureGroups.length > 0;
  const hasPricingTiers = pricingTiers && pricingTiers.length > 0;
  const hasList = list && list.length > 0;
  const hasLink = link && link.title && link.href;

  // Check if any tier has annual pricing data
  const hasAnnualOption =
    hasPricingTiers && pricingTiers.some((t) => t.annualPrice);

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly"
  );

  return (
    <div className="flex w-full rounded-2xl ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group">
      <div
        className={cn(
          "flex w-full flex-col justify-between rounded-2xl border border-border/60 bg-card p-6 sm:p-8 transition-shadow duration-300 hover:shadow-lg",
          color === "primary" && "border-primary/20 shadow-sm"
        )}
      >
        <div className={cn(color === "primary" ? "text-background" : undefined)}>
          {/* ── Header: title + badge ── */}
          {title && (
            <div className="flex items-start justify-between gap-3 mb-6">
              <h3 className="text-xl font-bold leading-tight tracking-tight">
                {title}
              </h3>
              {tagLine && (
                <Badge className="shrink-0 whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full">
                  {tagLine}
                </Badge>
              )}
            </div>
          )}

          {/* ── Price block ── */}
          {price && price.value != null && (
            <div className="mb-8">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold tracking-tight tabular-nums">
                  ${price.value.toLocaleString("es-MX")}
                </span>
                {price.period && (
                  <span className="text-sm text-muted-foreground font-medium">
                    {price.period}
                  </span>
                )}
              </div>
              {price.annualLabel && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {price.annualLabel}
                </p>
              )}
            </div>
          )}

          {/* ── Billing period toggle (only if annual data exists) ── */}
          {hasAnnualOption && (
            <div className="mb-5">
              <div className="inline-flex items-center rounded-lg bg-muted p-0.5 text-[13px]">
                <button
                  type="button"
                  onClick={() => setBillingPeriod("monthly")}
                  className={cn(
                    "rounded-md px-3 py-1.5 font-medium transition-all",
                    billingPeriod === "monthly"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod("annual")}
                  className={cn(
                    "rounded-md px-3 py-1.5 font-medium transition-all",
                    billingPeriod === "annual"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Anual
                </button>
              </div>
            </div>
          )}

          {/* ── Volume pricing tiers (structured table) ── */}
          {hasPricingTiers && (
            <div className="mb-6">
              <div className="space-y-0 divide-y divide-border/40">
                {pricingTiers.map((tier, index) => {
                  const showAnnual =
                    billingPeriod === "annual" && tier.annualPrice;
                  const displayPrice = showAnnual
                    ? tier.annualPrice
                    : tier.price;
                  const displayDiscount = showAnnual
                    ? tier.annualDiscount
                    : tier.discount;

                  return (
                    <div
                      key={`tier-${index}`}
                      className="flex items-center gap-2.5 py-2.5 first:pt-0"
                    >
                      <Check
                        size={15}
                        strokeWidth={2.5}
                        className="shrink-0 text-primary/70"
                      />
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[13.5px] leading-snug min-w-0">
                        <span className="font-medium">{tier.label}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="tabular-nums">{displayPrice}</span>
                        {displayDiscount && (
                          <>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-semibold text-primary">
                              {displayDiscount}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Categorized feature groups ── */}
          {hasFeatureGroups && (
            <div className="space-y-5">
              {featureGroups.map((group, groupIndex) => (
                <div key={`group-${groupIndex}`}>
                  {group.category && (
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 pb-1.5 border-b border-border/40">
                      {group.category}
                    </h4>
                  )}
                  {group.features && group.features.length > 0 && (
                    <ul className="space-y-2">
                      {group.features.map((feature, featureIndex) => (
                        <li
                          key={`${groupIndex}-${featureIndex}`}
                          className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                        >
                          <Check
                            size={15}
                            strokeWidth={2.5}
                            className="mt-0.5 shrink-0 text-primary/70"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Flat list (simple features) ── */}
          {hasList && (
            <ul className="space-y-2.5">
              {list.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                >
                  <Check
                    size={15}
                    strokeWidth={2.5}
                    className="mt-0.5 shrink-0 text-primary/70"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}

          {/* ── Excerpt / disclaimer ── */}
          {excerpt && (
            <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
              {excerpt}
            </p>
          )}
        </div>

        {/* ── CTA (only renders when link data exists) ── */}
        {hasLink && (
          <Button
            className="mt-8 w-full"
            size="lg"
            variant={stegaClean(link.buttonVariant)}
            asChild
          >
            <Link
              href={link.href}
              target={link.target ? "_blank" : undefined}
            >
              {link.title}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
