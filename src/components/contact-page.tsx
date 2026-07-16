import { Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { copy } from "@/lib/content";
import { siteConfig, type Locale } from "@/lib/site";

export function ContactPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return <div className="min-h-screen bg-[#fbfaf7]"><SiteHeader locale={locale}/><main><section className="bg-[#1c201d] text-white"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><p className="text-xs font-bold tracking-[0.18em] text-[#d56a5d]">PROJECT ENQUIRY</p><h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em]">{t.discuss}</h1><p className="mt-5 max-w-2xl leading-7 text-white/60">Tell us the product system, specifications, quantity and destination market. Our export team will help shape the right solution.</p></div></section><section className="mx-auto grid max-w-5xl gap-6 px-5 py-20 md:grid-cols-2 lg:px-8"><Card><CardHeader><CardTitle>Email</CardTitle></CardHeader><CardContent><p className="mb-6 text-sm leading-6 text-muted-foreground">Best for specifications, drawings, catalog requests and project documents.</p><Button asChild className="bg-[#a63429] hover:bg-[#8d2b23]"><a href={`mailto:${siteConfig.email}?subject=Flooring project enquiry`}><Mail/> {siteConfig.email}</a></Button></CardContent></Card><Card><CardHeader><CardTitle>WhatsApp</CardTitle></CardHeader><CardContent><p className="mb-6 text-sm leading-6 text-muted-foreground">Best for quick product questions, sample coordination and response updates.</p><Button asChild variant="outline"><a href={siteConfig.whatsapp} target="_blank" rel="noreferrer"><MessageCircle/> Start conversation</a></Button><p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Phone className="size-4"/>{siteConfig.phone}</p></CardContent></Card></section></main><SiteFooter locale={locale}/></div>;
}
