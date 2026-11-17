import { defineField, defineType } from "sanity";
import { Video } from "lucide-react";

const TEXT_POSITIONS = [
  { title: "Left", value: "left" },
  { title: "Right", value: "right" },
  { title: "Top", value: "top" },
  { title: "Bottom", value: "bottom" },
];

export default defineType({
  name: "video-1",
  title: "Video Block",
  type: "object",
  icon: Video,
  description: "A video section with configurable text placement and YouTube or uploaded video support",
  fields: [
    defineField({
      name: "padding",
      type: "section-padding",
    }),
    defineField({
      name: "colorVariant",
      type: "color-variant",
      title: "Color Variant",
      description: "Select a background color variant",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "block-content",
      description: "Optional companion text displayed alongside the video",
    }),
    defineField({
      name: "links",
      type: "array",
      of: [{ type: "link" }],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: "textPosition",
      title: "Text Position",
      type: "string",
      description: "Position of the text relative to the video",
      options: {
        list: TEXT_POSITIONS.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "right",
    }),
    defineField({
      name: "videoType",
      title: "Video Source",
      type: "string",
      description: "Choose between a YouTube URL or an uploaded video file",
      options: {
        list: [
          { title: "YouTube URL", value: "youtube" },
          { title: "Uploaded Video", value: "upload" },
        ],
        layout: "radio",
      },
      initialValue: "youtube",
    }),
    defineField({
      name: "youtubeUrl",
      title: "YouTube URL",
      type: "url",
      description: "Paste the full YouTube video URL (e.g. https://www.youtube.com/watch?v=...)",
      hidden: ({ parent }) => parent?.videoType !== "youtube",
      validation: (Rule) =>
        Rule.uri({
          scheme: ["http", "https"],
        }),
    }),
    defineField({
      name: "uploadedVideo",
      title: "Uploaded Video",
      type: "file",
      description: "Upload a video file (mp4, webm, mov)",
      hidden: ({ parent }) => parent?.videoType !== "upload",
      options: {
        accept: "video/mp4,video/webm,video/quicktime",
      },
    }),
    defineField({
      name: "videoAspectRatio",
      title: "Aspect Ratio",
      type: "string",
      description: "Select the aspect ratio of the video",
      options: {
        list: [
          { title: "16:9", value: "16/9" },
          { title: "4:3", value: "4/3" },
          { title: "1:1", value: "1/1" },
        ],
        layout: "radio",
      },
      initialValue: "16/9",
    }),
    defineField({
      name: "videoLoop",
      title: "Loop Video",
      type: "boolean",
      description: "Whether the video should play in a loop",
      initialValue: false,
    }),
    defineField({
      name: "videoControls",
      title: "Show Controls",
      type: "boolean",
      description: "Show playback controls on the video",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare({ title }) {
      return {
        title: "Video Block",
        subtitle: title,
      };
    },
  },
});
