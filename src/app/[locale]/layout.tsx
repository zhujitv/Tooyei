import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { isLocale, localeDirection } from "@/lib/site";

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <div lang={locale} dir={localeDirection(locale)}>
      {children}
    </div>
  );
}
