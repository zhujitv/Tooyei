import {
  ArrowUpRight,
  BriefcaseBusiness,
  Camera,
  MessageCircle,
  Play,
  Users,
  type LucideIcon,
} from "lucide-react";
import { visibleSocialLinks, type SocialLinkKey } from "@/config/social";
import { cn } from "@/lib/utils";

const icons: Record<SocialLinkKey, LucideIcon> = {
  linkedin: BriefcaseBusiness,
  instagram: Camera,
  youtube: Play,
  facebook: Users,
  whatsapp: MessageCircle,
};

export function SocialLinks({
  showLabels = false,
  showArrow = false,
  className,
  linkClassName,
}: {
  showLabels?: boolean;
  showArrow?: boolean;
  className?: string;
  linkClassName?: string;
}) {
  if (visibleSocialLinks.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {visibleSocialLinks.map(({ key, label, href }) => {
        const Icon = icons[key];

        return (
          <a
            key={key}
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
