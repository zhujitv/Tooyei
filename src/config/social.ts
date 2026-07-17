export const socialLinks = [
  { key: "linkedin", label: "LinkedIn", href: "" },
  { key: "instagram", label: "Instagram", href: "" },
  { key: "youtube", label: "YouTube", href: "" },
  { key: "facebook", label: "Facebook", href: "" },
  {
    key: "whatsapp",
    label: "WhatsApp",
    href: "https://api.whatsapp.com/send?phone=8618015007771",
  },
] as const;

export type SocialLinkKey = (typeof socialLinks)[number]["key"];

export const visibleSocialLinks = socialLinks.filter(({ href }) => href.length > 0);
