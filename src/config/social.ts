export const socialPlatforms = [
  "linkedin",
  "instagram",
  "youtube",
  "facebook",
  "whatsapp",
  "tiktok",
  "pinterest",
  "x",
  "other",
] as const;

export type SocialLinkKey = (typeof socialPlatforms)[number];

export type PublicSocialLink = {
  id: string;
  key: SocialLinkKey;
  label: string;
  href: string;
};

export const socialIconImages: Record<SocialLinkKey, { src: string; title: string }> = {
  linkedin: { src: "/social/linkedin.svg", title: "LinkedIn" },
  instagram: { src: "/social/instagram.svg", title: "Instagram" },
  youtube: { src: "/social/youtube.svg", title: "YouTube" },
  facebook: { src: "/social/facebook.svg", title: "Facebook" },
  whatsapp: { src: "/social/whatsapp.svg", title: "WhatsApp" },
  tiktok: { src: "/social/tiktok.svg", title: "TikTok" },
  pinterest: { src: "/social/pinterest.svg", title: "Pinterest" },
  x: { src: "/social/x.svg", title: "X" },
  other: { src: "/social/other.svg", title: "Social link" },
};

export const socialLinks: PublicSocialLink[] = [
  { id: "fallback-linkedin", key: "linkedin", label: "LinkedIn", href: "" },
  { id: "fallback-instagram", key: "instagram", label: "Instagram", href: "" },
  { id: "fallback-youtube", key: "youtube", label: "YouTube", href: "" },
  { id: "fallback-facebook", key: "facebook", label: "Facebook", href: "" },
  {
    id: "fallback-whatsapp",
    key: "whatsapp",
    label: "WhatsApp",
    href: "https://api.whatsapp.com/send?phone=8618015007771",
  },
];

export const visibleSocialLinks = socialLinks.filter(({ href }) => href.length > 0);
