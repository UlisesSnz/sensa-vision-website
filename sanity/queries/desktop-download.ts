import { groq } from "next-sanity";

export const desktopDownloadQuery = groq`
  _type == "desktop-download" => {
    _type,
    padding,
    colorVariant,
    sectionWidth,
    stackAlign,
    tagLine,
    title,
    body,
    downloadPlatform,
    downloadArchitecture,
    buttonTitle,
    buttonVariant,
  },
`;
