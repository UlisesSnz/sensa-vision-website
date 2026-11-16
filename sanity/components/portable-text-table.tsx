"use client";

import { useId } from "react";
import {
  defineContainer,
  useEditor,
  type ContainerRenderProps,
} from "@portabletext/editor";
import { Table, type TableTokens } from "@portabletext/plugin-table/ui";
import "@portabletext/plugin-table/ui/styles.css";
import { Box, Stack, Text, TextInput, useTheme_v2 } from "@sanity/ui";
import type { PortableTextPluginsProps } from "sanity";

/** The native table owns selection, edits and reordering. Only caption is custom. */
export function TableWithCaption(props: ContainerRenderProps) {
  const editor = useEditor();
  const captionId = useId();
  const { color, font } = useTheme_v2();
  const tokens: TableTokens = {
    "--pt-plugin-table-bg": color.bg,
    "--pt-plugin-table-fg": color.fg,
    "--pt-plugin-table-border": color.border,
    "--pt-plugin-table-header-bg": color.muted.bg,
    "--pt-plugin-table-accent": color.focusRing,
    "--pt-plugin-table-menu-bg": color.bg,
    "--pt-plugin-table-menu-border": color.border,
    "--pt-plugin-table-menu-hover": color.muted.bg,
    "--pt-plugin-table-font-family": font.text.family,
  };
  return (
    <div>
      <Box contentEditable={false} paddingBottom={3}>
        <Stack space={2}>
          <Text as="label" htmlFor={captionId} size={1}>
            Título de la tabla (opcional)
          </Text>
          <TextInput
            id={captionId}
            readOnly={props.readOnly}
            style={{ zIndex: 3 }}
            value={
              typeof props.node.caption === "string" ? props.node.caption : ""
            }
            onChange={(event) => {
              if (props.readOnly) return;
              editor.send({
                type: "set",
                at: [...props.path, "caption"],
                value: event.currentTarget.value,
              });
            }}
          />
        </Stack>
      </Box>
      <Table {...props} tokens={tokens} />
    </div>
  );
}

// Stable definitions avoid re-registering the native plugin while typing.
export const tableContainers = {
  table: defineContainer({
    type: "table",
    arrayField: "rows",
    // Container renderers are callbacks; keep hooks inside a React component.
    render: (props) => <TableWithCaption {...props} />,
  }),
};

export function PortableTextTablePlugins(props: PortableTextPluginsProps) {
  return props.renderDefault({
    ...props,
    plugins: {
      ...props.plugins,
      table: {
        ...props.plugins.table,
        enabled: true,
        containers: tableContainers,
      },
    },
  });
}
