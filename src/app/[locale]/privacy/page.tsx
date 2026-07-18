import { notFound } from "next/navigation";
import { PolicyPage } from "@/components/policy-page";
import { policies } from "@/config/policies";
import { safeMetadata } from "@/lib/metadata";
import { isLocale, localizedAlternates, localizedPath, siteConfig, type Locale } from "@/lib/site";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const resolveLocale = async (params: PageProps["params"]): Promise<Locale | null> => {
  const { locale } = await params;
  return isLocale(locale) ? locale : null;
};

export async function generateMetadata({ params }: PageProps) {
  return safeMetadata("policy.privacy.metadata", async () => {
    const locale = await resolveLocale(params);
    const policy = locale ? policies[locale].privacy : policies.zh.privacy;
    return {
      title: `${policy.title} | TOOYEI`,
      description: policy.description,
      alternates: {
        canonical: locale ? localizedPath(locale, "/privacy") : "/privacy",
        languages: localizedAlternates("/privacy"),
      },
      openGraph: {
        title: `${policy.title} | TOOYEI`,
        description: policy.description,
        url: new URL(locale ? localizedPath(locale, "/privacy") : "/privacy", siteConfig.url).toString(),
      },
    };
  }, {
    title: "隐私政策 | TOOYEI",
    description: policies.zh.privacy.description,
  });
}

export default async function LocalizedPrivacyPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  if (!locale) notFound();
  return <PolicyPage kind="privacy" locale={locale} />;
}
