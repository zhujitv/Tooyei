import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tooyei.com"),
  title: { default: "Tooyei 专业地板制造商", template: "%s | Tooyei" },
  description: "工厂直供 SPC、WPC、LVT 与强化地板，为批发、商业和 OEM 项目提供稳定品质与出口服务。",
  openGraph: { type: "website", siteName: "Tooyei", locale: "en", images: ["/media/hero-flooring.jpg"] },
  twitter: { card: "summary_large_image", images: ["/media/hero-flooring.jpg"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" className="h-full antialiased">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
