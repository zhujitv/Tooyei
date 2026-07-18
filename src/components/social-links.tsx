"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  socialIconImages,
  socialLinkVariants,
  visibleSocialLinks,
  type PublicSocialLink,
  type SocialLinkVariant,
} from "@/config/social";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { cn } from "@/lib/utils";

export function SocialLinks({
  showLabels = false,
  className,
  linkClassName,
  links,
  variant,
}: {
  showLabels?: boolean;
  className?: string;
  linkClassName?: string;
  links?: PublicSocialLink[];
  variant: SocialLinkVariant;
}) {
  const [resolvedLinks, setResolvedLinks] = useState<PublicSocialLink[]>(links ?? visibleSocialLinks);

  useEffect(() => {
    if (links) return;
    const controller = new AbortController();
    fetchWithRetry("/api/social-links", { signal: controller.signal, timeoutMs: 10_000 })
      .then((response) => response.json())
      .then((payload: { ok?: boolean; links?: PublicSocialLink[] }) => {
        if (payload.ok && Array.isArray(payload.links)) setResolvedLinks(payload.links);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [links]);

  const displayedLinks = socialLinkVariants[variant].flatMap((platform) => {
    const link = resolvedLinks.find(({ key }) => key === platform);
    return link ? [link] : [];
  });

  if (displayedLinks.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {displayedLinks.map(({ id, key, label, href }) => {
        const icon = socialIconImages[key] ?? socialIconImages.other;

        return (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`TOOYEI ${label}`}
            className={cn(
              "group inline-flex min-h-11 items-center justify-center gap-3 transition-colors duration-300",
              linkClassName,
            )}
          >
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white p-1 shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:-translate-y-0.5">
              <Image src={icon.src} alt="" width={14} height={14} className="object-contain" aria-hidden="true" />
            </span>
            {showLabels ? <span>{label}</span> : null}
          </a>
        );
      })}
    </div>
  );
}
