import { Image } from "next/dist/client/image-component";
import type { ImageLoaderProps, ImageProps } from "next/image";

// Keep the real Next Image component, replacing only the server optimizer URL.
// Vite has no Next image endpoint; the fixture is served locally at every size.
const fixtureLoader = ({ width, quality }: ImageLoaderProps) =>
  `/editor.png?w=${width}&q=${quality ?? 75}`;

export default function FixtureImage(props: ImageProps) {
  return <Image {...props} alt={props.alt} loader={fixtureLoader} />;
}
