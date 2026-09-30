"use client";

import { Button, Flex, Stack, Text } from "@sanity/ui";
import { type ObjectInputProps, set, unset } from "sanity";

export default function OptionalLinkInput(props: ObjectInputProps) {
  const hasLink = props.value != null;

  return (
    <Stack space={3}>
      {hasLink ? (
        props.renderDefault(props)
      ) : (
        <Text muted size={1}>
          La tarjeta se mostrará sin enlace.
        </Text>
      )}
      <Flex>
        <Button
          type="button"
          disabled={props.readOnly}
          mode={hasLink ? "bleed" : "ghost"}
          tone={hasLink ? "critical" : "primary"}
          text={hasLink ? "Quitar enlace" : "Agregar enlace"}
          onClick={() => {
            if (props.readOnly) return;

            props.onChange(
              hasLink
                ? unset()
                : set({
                    _type: props.schemaType.name,
                    targetType: "url",
                    buttonVariant: "default",
                  }),
            );
          }}
        />
      </Flex>
    </Stack>
  );
}
