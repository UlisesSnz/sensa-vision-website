import type {
  SanityImageObject,
  SanityImageDimensions,
} from "@sanity/image-url/lib/types/types";
import type { SanityDocument } from "next-sanity";
import type { Locale } from "@/i18n/config";
import type {
  DesktopReleaseArchitecture,
  DesktopReleasePlatform,
} from "@/lib/desktop-release";

declare global {
  namespace Sanity {
    // pages
    type PageBase = SanityDocument<{
      title?: string;
      slug: { current: string };
      language: Locale;
      meta_title: string;
      meta_description: string;
      ogImage?: Image;
      noindex: boolean;
      translations?: Translation[];
    }>;

    type Page = PageBase & {
      readonly _type: "page";
      blocks?: Block[];
    };

    type Post = PageBase &
      SanityDocument<{
        readonly _type: "post";
        excerpt?: string;
        author?: Author;
        categories?: Category[];
        body: any;
        image?: Image;
      }>;

    type Author = SanityDocument<{
      readonly _type: "author";
      language: Locale;
      name: string;
      slug: { current: string };
      image?: Image;
    }>;

    type Category = SanityDocument<{
      readonly _type: "category";
      language: Locale;
      title: string;
    }>;

    type Translation = {
      _id: string;
      _type:
        | "page"
        | "post"
        | "author"
        | "category"
        | "faq"
        | "testimonial"
        | "siteSettings";
      language: Locale;
      slug?: { current: string };
    };

    type SiteSettings = SanityDocument<{
      readonly _type: "siteSettings";
      language: Locale;
      headerNavigation?: Array<{
        label?: string;
        href?: string;
        target?: boolean;
        subLinks?: Array<{
          label?: string;
          href?: string;
          target?: boolean;
        }>;
      }>;
    }>;

    type DesktopInstaller = {
      objectKey: string;
      url: string;
      fileName: string;
      sizeBytes: number;
      mimeType: string;
      etag: string;
    };

    type DesktopRelease = {
      version: string;
      releasedAt: string;
      channel: "stable";
      platform: DesktopReleasePlatform;
      architecture: DesktopReleaseArchitecture;
      installer: DesktopInstaller;
    };

    type Link = {
      _key?: string;
      title: string;
      href?: string;
      target?: boolean;
      targetType?: "url" | "desktopDownload";
      downloadPlatform?: DesktopReleasePlatform;
      downloadArchitecture?: DesktopReleaseArchitecture;
      buttonVariant?:
        | "default"
        | "secondary"
        | "link"
        | "destructive"
        | "outline"
        | "ghost"
        | null;
    };

    type Image = SanityImageObject &
      Partial<{
        alt: string;
        asset: {
          _id: string;
          metadata: {
            dimensions: SanityImageDimensions;
            lqip: string;
          };
        };
      }>;

    // objects
    type Block<T = string> = {
      _type: T;
      _key: string;
      uid?: string;
    };
  }
}

export {};
