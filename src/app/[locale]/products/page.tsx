import { notFound } from "next/navigation";
import { ProductsPage } from "@/components/products-page";
import { isLocale, locales } from "@/lib/site";
export const dynamic = "force-dynamic";
export function generateStaticParams(){return locales.map((locale)=>({locale}));}
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))notFound();return <ProductsPage locale={locale}/>;}
