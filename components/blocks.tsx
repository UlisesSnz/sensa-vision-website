import Hero1 from "@/components/ui/hero/hero-1";
import SectionHeader from "@/components/ui/section-header";
import SplitRow from "@/components/ui/split/split-row";
import GridRow from "@/components/ui/grid/grid-row";
import Carousel1 from "@/components/ui/carousel/carousel-1";
import Carousel2 from "@/components/ui/carousel/carousel-2";
import TimelineRow from "@/components/ui/timeline/timeline-row";
import Cta1 from "@/components/ui/cta/cta-1";
import LogoCloud1 from "@/components/ui/logo-cloud/logo-cloud-1";
import FAQs from "@/components/ui/faqs";
import FormNewsletter from "@/components/ui/forms/newsletter";
import FormEmailJs from "@/components/ui/forms/emailjs";
import Video1 from "@/components/ui/video/video-1";
import Lottie1 from "@/components/ui/lottie/lottie-1";
import DesktopDownload from "@/components/ui/desktop-download";
import type { Locale } from "@/i18n/config";
import type { UiDictionary } from "@/i18n/dictionaries";
import {
  collectDesktopReleaseTargets,
  type DesktopReleaseLookup,
} from "@/lib/desktop-release-content";
import { getDesktopReleaseTargetKey } from "@/lib/desktop-release";
import { fetchLatestDesktopRelease } from "@/sanity/lib/content";

const componentMap: { [key: string]: React.ComponentType<any> } = {
  "hero-1": Hero1,
  "section-header": SectionHeader,
  "split-row": SplitRow,
  "grid-row": GridRow,
  "carousel-1": Carousel1,
  "carousel-2": Carousel2,
  "timeline-row": TimelineRow,
  "cta-1": Cta1,
  "logo-cloud-1": LogoCloud1,
  faqs: FAQs,
  "form-newsletter": FormNewsletter,
  "form-emailjs": FormEmailJs,
  "video-1": Video1,
  "lottie-1": Lottie1,
  "desktop-download": DesktopDownload,
};

export default async function Blocks({
  blocks,
  locale,
  dictionary,
}: {
  blocks?: Sanity.Block[];
  locale: Locale;
  dictionary: UiDictionary;
}) {
  const desktopTargets = collectDesktopReleaseTargets(blocks);
  const releaseEntries = await Promise.all(
    desktopTargets.map(async (target) => [
      getDesktopReleaseTargetKey(target),
      await fetchLatestDesktopRelease(target.platform, target.architecture),
    ] as const),
  );
  const desktopReleases = Object.fromEntries(
    releaseEntries,
  ) as DesktopReleaseLookup;

  return (
    <>
      {blocks?.map((block: Sanity.Block) => {
        const Component = componentMap[block._type];
        if (!Component) {
          // Fallback for unknown block types to debug
          return <div data-type={block._type} key={block._key} />;
        }
        return (
          <Component
            {...block}
            key={block._key}
            locale={locale}
            formMessages={dictionary.forms}
            pricingMessages={dictionary.pricing}
            mediaMessages={dictionary.media}
            desktopReleases={desktopReleases}
            downloadMessages={dictionary.downloads}
          />
        );
      })}
    </>
  );
}
