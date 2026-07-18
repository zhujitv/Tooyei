import type { Metadata } from "next";
import { Geist_Mono, Inter, Noto_Sans_SC } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { isLocale, localeDirection } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  weight: "variable",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tooyei.com"),
  title: { default: "Tooyei 专业地板制造商", template: "%s | Tooyei" },
  description: "工厂直供 SPC、WPC、LVT 与强化地板，为批发、商业和 OEM 项目提供稳定品质与出口服务。",
  openGraph: { type: "website", siteName: "TOOYEI", locale: "zh_CN", images: [{ url: "/media/hero-flooring.jpg", width: 1200, height: 630, alt: "TOOYEI flooring systems" }] },
  twitter: { card: "summary_large_image", images: ["/media/hero-flooring.jpg"] },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestedLocale = (await headers()).get("x-tooyei-locale") ?? "zh";
  const locale = isLocale(requestedLocale) ? requestedLocale : "zh";

  return (
    <html
      lang={locale === "zh" ? "zh-CN" : locale}
      dir={localeDirection(locale)}
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${geistMono.variable} ${notoSansSC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
