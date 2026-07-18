"use client";

import {
  AtSign,
  ArrowUpRight,
  BriefcaseBusiness,
  Camera,
  Link2,
  MessageCircle,
  Music2,
  PinIcon,
  Play,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { visibleSocialLinks, type PublicSocialLink, type SocialLinkKey } from "@/config/social";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { cn } from "@/lib/utils";

const icons: Record<SocialLinkKey, LucideIcon> = {
  linkedin: BriefcaseBusiness,
  instagram: Camera,
  youtube: Play,
  facebook: Users,
  whatsapp: MessageCircle,
  tiktok: Music2,
  pinterest: PinIcon,
  x: AtSign,
  other: Link2,
};

export function SocialLinks({
  showLabels = false,
  showArrow = false,
  className,
  linkClassName,
  links,
}: {
  showLabels?: boolean;
  showArrow?: boolean;
  className?: string;
  linkClassName?: string;
  links?: PublicSocialLink[];
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

  if (resolvedLinks.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {resolvedLinks.map(({ id, key, label, href }) => {
        const Icon = icons[key];

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
            <Icon className="size-4 shrink-0 transition-colors duration-300 group-hover:text-[var(--gold)]" />
            {showLabels ? <span>{label}</span> : null}
            {showArrow ? (
              <ArrowUpRight className="ml-auto size-3.5 text-current/40 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            ) : null}
          </a>
        );
      })}
    </div>
  );
}
