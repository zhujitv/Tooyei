"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import {
  LANGUAGE_COOKIE,
  LANGUAGE_COOKIE_MAX_AGE,
  LANGUAGE_PROMPT_COOKIE,
} from "@/lib/language-preference";
import type { Locale } from "@/lib/site";

const cookieAttributes = () =>
  `Path=/; Max-Age=${LANGUAGE_COOKIE_MAX_AGE}; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;

export function persistLanguagePreference(locale: Locale) {
  const attributes = cookieAttributes();
  document.cookie = `${LANGUAGE_COOKIE}=${encodeURIComponent(locale)}; ${attributes}`;
  document.cookie = `${LANGUAGE_PROMPT_COOKIE}=selected; ${attributes}`;
}

export function dismissLanguageRecommendation() {
  document.cookie = `${LANGUAGE_PROMPT_COOKIE}=dismissed; ${cookieAttributes()}`;
}

type LanguagePreferenceLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  locale: Locale;
};

export function LanguagePreferenceLink({ locale, onClick, ...props }: LanguagePreferenceLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        persistLanguagePreference(locale);
        onClick?.(event);
      }}
    />
  );
}
