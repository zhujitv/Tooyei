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
  return safeMetadata("policy.cookies.metadata", async () => {
    const locale = await resolveLocale(params);
    const policy = locale ? policies[locale].cookies : policies.zh.cookies;
    return {
      title: `${policy.title} | TOOYEI`,
      description: policy.description,
      alternates: {
        canonical: locale ? localizedPath(locale, "/cookies") : "/cookies",
        languages: localizedAlternates("/cookies"),
      },
      openGraph: {
        title: `${policy.title} | TOOYEI`,
        description: policy.description,
        url: new URL(locale ? localizedPath(locale, "/cookies") : "/cookies", siteConfig.url).toString(),
      },
    };
  }, {
    title: "Cookies 说明 | TOOYEI",
    description: policies.zh.cookies.description,
  });
}

export default async function LocalizedCookiesPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  if (!locale) notFound();
  return <PolicyPage kind="cookies" locale={locale} />;
}
