import { Image } from "next/dist/client/image-component";
import type { ImageLoaderProps, ImageProps } from "next/image";

function localImage({ src, width }: ImageLoaderProps) {
  const name = new URL(src).pathname
    .split("/")
    .pop()
    ?.split("-")[0]
    .replace(/0+$/, "");
  return `/${name}.svg?w=${width}`;
}
export default function FixtureImage(props: ImageProps) {
  return <Image {...props} alt={props.alt} loader={localImage} />;
}
