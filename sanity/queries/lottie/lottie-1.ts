import { groq } from "next-sanity";

export const lottie1Query = groq`
  _type == "lottie-1" => {
    _type,
    padding,
    colorVariant,
    body,
    links,
    textPosition,
    lottieFile{
      asset->{
        _id,
        url,
        mimeType
      }
    },
    lottieSize,
    lottieFit,
    lottieLoop,
    lottieAutoplay,
  },
`;
