import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tooyei.com"),
  title: { default: "Tooyei Flooring Manufacturer", template: "%s | Tooyei" },
  description: "Factory-direct SPC, WPC, LVT and laminate flooring for wholesale, commercial and OEM projects.",
  openGraph: { type: "website", siteName: "Tooyei", locale: "en", images: ["/media/hero-flooring.jpg"] },
  twitter: { card: "summary_large_image", images: ["/media/hero-flooring.jpg"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
