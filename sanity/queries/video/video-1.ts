import { groq } from "next-sanity";

export const video1Query = groq`
  _type == "video-1" => {
    _type,
    padding,
    colorVariant,
    body,
    links,
    textPosition,
    videoType,
    youtubeUrl,
    uploadedVideo{
      asset->{
        _id,
        url,
        mimeType
      }
    },
    videoAspectRatio,
    videoLoop,
    videoAutoplay,
    videoControls,
  },
`;
