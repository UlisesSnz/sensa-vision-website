import { defineField, defineType } from "sanity";

import DesktopInstallerInput from "@/sanity/components/desktop-installer-input";

export default defineType({
  name: "desktopInstaller",
  title: "Desktop installer",
  type: "object",
  components: {
    input: DesktopInstallerInput,
  },
  fields: [
    defineField({ name: "objectKey", type: "string", readOnly: true }),
    defineField({ name: "url", type: "url", readOnly: true }),
    defineField({ name: "fileName", type: "string", readOnly: true }),
    defineField({ name: "sizeBytes", type: "number", readOnly: true }),
    defineField({ name: "mimeType", type: "string", readOnly: true }),
    defineField({ name: "etag", type: "string", readOnly: true }),
  ],
});
