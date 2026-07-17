"use client";

import { useState } from "react";
import { Globe2, X } from "lucide-react";
import { LanguagePreferenceLink, dismissLanguageRecommendation } from "@/components/language-preference-link";
import { languageMarkers, languageNames, localizedPath, type Locale } from "@/lib/site";

const bannerCopy: Record<Locale, { message: string; action: string; dismiss: string }> = {
  zh: { message: "检测到您的浏览器使用中文。", action: "访问中文网站", dismiss: "关闭语言推荐" },
  en: { message: "Your browser language appears to be English.", action: "Continue in English", dismiss: "Dismiss language recommendation" },
  es: { message: "El idioma de su navegador parece ser español.", action: "Continuar en español", dismiss: "Cerrar recomendación de idioma" },
  de: { message: "Ihre Browsersprache scheint Deutsch zu sein.", action: "Auf Deutsch fortfahren", dismiss: "Sprachempfehlung schließen" },
  fr: { message: "La langue de votre navigateur semble être le français.", action: "Continuer en français", dismiss: "Fermer la recommandation de langue" },
  ru: { message: "Похоже, язык вашего браузера — русский.", action: "Продолжить на русском", dismiss: "Закрыть рекомендацию языка" },
  ja: { message: "ブラウザの言語は日本語に設定されています。", action: "日本語サイトを見る", dismiss: "言語の案内を閉じる" },
  it: { message: "La lingua del browser sembra essere l’italiano.", action: "Continua in italiano", dismiss: "Chiudi il suggerimento della lingua" },
  ar: { message: "يبدو أن لغة متصفحك هي العربية.", action: "المتابعة بالعربية", dismiss: "إغلاق اقتراح اللغة" },
};

export function LanguageRecommendationBanner({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const content = bannerCopy[locale];
  return (
    <aside
      aria-label="Language recommendation"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border border-white/70 bg-white/92 p-3.5 text-[#172033] shadow-[0_24px_70px_rgba(8,17,31,0.20)] backdrop-blur-xl sm:bottom-6 sm:p-4"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F2F4F7] text-[#25344F]">
        <Globe2 className="size-4.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-5">
        <p className="text-sm leading-6 text-[#475467]">
          {content.message} <span className="font-semibold text-[#172033]"><span aria-hidden>{languageMarkers[locale]}</span> {languageNames[locale]}</span>
        </p>
        <LanguagePreferenceLink locale={locale} href={localizedPath(locale)} className="mt-1 inline-flex min-h-10 shrink-0 items-center text-sm font-semibold text-[#25344F] underline decoration-[#B9975B]/55 underline-offset-4 hover:text-[#B68A4C] sm:mt-0">
          {content.action}
        </LanguagePreferenceLink>
      </div>
      <button
        type="button"
        onClick={() => {
          dismissLanguageRecommendation();
          setVisible(false);
        }}
        className="grid size-10 shrink-0 place-items-center rounded-xl text-[#667085] transition hover:bg-[#F2F4F7] hover:text-[#172033]"
        aria-label={content.dismiss}
      >
        <X className="size-4" aria-hidden />
      </button>
    </aside>
  );
}
