import Image from "next/image";
import PostDate from "./date";
import { Facebook, Linkedin, Mail } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";
import CopyLinkButton from "./copy-link-button";

export default function PostHero({
  title,
  author,
  image,
  slug,
  _createdAt,
}: Partial<{
  title: string;
  author: Sanity.Author;
  excerpt: string;
  image: Sanity.Image;
  slug: { current: string };
  _createdAt: string;
}>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const postPath = slug?.current ? `/blog/${slug.current}` : "/blog";
  const postUrl = `${siteUrl}${postPath}`;
  const encodedPostUrl = encodeURIComponent(postUrl);
  const encodedTitle = encodeURIComponent(title ?? "");
  const shareActionClassName =
    "inline-flex h-6 w-6 appearance-none items-center justify-center border-0 bg-transparent p-0 text-foreground transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  return (
    <>
      {title && <h1 className="mb-4 md:mb-6 text-3xl lg:text-5xl">{title}</h1>}
      {image && image.asset?._id && (
        <div className="my-4 md:my-6 rounded-2xl overflow-hidden">
          <Image
            src={urlFor(image).auto("format").fit("max").quality(100).url()}
            alt={image.alt || ""}
            placeholder="blur"
            blurDataURL={image.asset?.metadata?.lqip || undefined}
            width={image.asset?.metadata?.dimensions?.width || 1200}
            height={image?.asset?.metadata?.dimensions?.height || 630}
            quality={100}
          />
        </div>
      )}
      <div className="flex items-center justify-between gap-2 text-sm md:text-base">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex items-center gap-2">
            {author?.image && (
              <div className="relative w-6 h-6 md:w-10 md:h-10">
                <Image
                  src={urlFor(author.image).url()}
                  alt={author.image.alt ? author.image.alt : ""}
                  fill
                  style={{
                    objectFit: "cover",
                  }}
                  placeholder="blur"
                  blurDataURL={author.image.asset?.metadata?.lqip || undefined}
                  sizes="40px"
                  className="w-10 h-10 rounded-full mr-2"
                />
              </div>
            )}
            {author?.name && <div>{author.name}</div>}
            <div className="hidden md:block">•</div>
          </div>
          <PostDate date={_createdAt as string} />
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div>Comparte este post</div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              className={shareActionClassName}
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedPostUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en Facebook"
              title="Compartir en Facebook"
            >
              <Facebook size={24} />
            </a>
            <a
              className={shareActionClassName}
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedPostUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en LinkedIn"
              title="Compartir en LinkedIn"
            >
              <Linkedin size={24} />
            </a>
            <a
              className={shareActionClassName}
              href={`https://twitter.com/intent/tweet?url=${encodedPostUrl}&text=${encodedTitle}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en X"
              title="Compartir en X"
            >
              <svg
                aria-hidden="true"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  className="fill-current"
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"
                />
              </svg>
            </a>
            <a
              className={shareActionClassName}
              href={`mailto:?subject=${encodedTitle}&body=${encodedTitle}%0A%0A${encodedPostUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir por email"
              title="Compartir por email"
            >
              <Mail size={24} />
            </a>
            <CopyLinkButton className={shareActionClassName} url={postUrl} />
          </div>
        </div>
      </div>
      <hr className="my-4 md:my-6 border-primary/30" />
    </>
  );
}
