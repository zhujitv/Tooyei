import { notFound } from "next/navigation";
import { ProductsPage } from "@/components/products-page";
import { isLocale, locales } from "@/lib/site";
export function generateStaticParams(){return locales.filter((locale)=>locale!=="en").map((locale)=>({locale}));}
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale)||locale==="en")notFound();return <ProductsPage locale={locale}/>;}
