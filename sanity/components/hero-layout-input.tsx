"use client";

import { Flex, Radio, Text } from "@sanity/ui";
import { useId } from "react";
import type { StringInputProps } from "sanity";
import { HERO_LAYOUTS } from "@/sanity/schemas/blocks/shared/layout-variants";

export default function HeroLayoutInput({
  elementProps,
  schemaType,
  validationError,
  value,
}: StringInputProps) {
  const name = useId();
  const { id, ref, style, ...inputProps } = elementProps;
  const selected = HERO_LAYOUTS.find((layout) => layout.value === value) ?? HERO_LAYOUTS[0];

  return (
    <Flex role="radiogroup" aria-label={schemaType.title} gap={4} wrap="wrap" style={style}>
      {HERO_LAYOUTS.map((layout) => {
        const checked = layout === selected;
        return (
          <Flex key={layout.value} as="label" align="center" gap={2} paddingY={2}>
            <Radio
              {...inputProps}
              id={checked ? id : undefined}
              ref={checked ? ref : undefined}
              name={name}
              aria-label={layout.title}
              value={layout.value}
              checked={checked}
              disabled={inputProps.readOnly}
              customValidity={validationError}
            />
            <Text size={1}>{layout.title}</Text>
          </Flex>
        );
      })}
    </Flex>
  );
}
