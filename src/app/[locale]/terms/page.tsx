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
  return safeMetadata("policy.terms.metadata", async () => {
    const locale = await resolveLocale(params);
    const policy = locale ? policies[locale].terms : policies.zh.terms;
    return {
      title: `${policy.title} | TOOYEI`,
      description: policy.description,
      alternates: {
        canonical: locale ? localizedPath(locale, "/terms") : "/terms",
        languages: localizedAlternates("/terms"),
      },
      openGraph: {
        title: `${policy.title} | TOOYEI`,
        description: policy.description,
        url: new URL(locale ? localizedPath(locale, "/terms") : "/terms", siteConfig.url).toString(),
      },
    };
  }, {
    title: "使用条款 | TOOYEI",
    description: policies.zh.terms.description,
  });
}

export default async function LocalizedTermsPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  if (!locale) notFound();
  return <PolicyPage kind="terms" locale={locale} />;
}
