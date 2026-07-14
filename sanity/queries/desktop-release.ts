import { groq } from "next-sanity";

export const LATEST_DESKTOP_RELEASE_QUERY = groq`
  *[
    _type == "desktopRelease" &&
    channel == "stable" &&
    platform == $platform &&
    architecture == $architecture &&
    defined(installer.url)
  ] | order(releasedAt desc, _updatedAt desc)[0]{
    version,
    releasedAt,
    channel,
    platform,
    architecture,
    installer{
      objectKey,
      url,
      fileName,
      sizeBytes,
      mimeType,
      etag
    }
  }
`;
