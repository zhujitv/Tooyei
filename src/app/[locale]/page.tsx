import { notFound } from "next/navigation";
import { HomePage } from "@/components/home-page";
import { isLocale, locales } from "@/lib/site";
export const dynamic = "force-dynamic";
export function generateStaticParams(){return locales.filter((locale)=>locale!=="zh").map((locale)=>({locale}));}
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale)||locale==="zh")notFound();return <HomePage locale={locale}/>;}
