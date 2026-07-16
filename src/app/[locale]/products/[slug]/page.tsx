import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product-page";
import { getPublishedProduct, getPublishedProductSlugs } from "@/lib/repositories/products";
import { isLocale, locales } from "@/lib/site";
export const revalidate=3600;
export async function generateStaticParams(){const slugs=await getPublishedProductSlugs();return locales.filter((locale)=>locale!=="zh").flatMap((locale)=>slugs.map((slug)=>({locale,slug})));}
export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string}>}):Promise<Metadata>{const {locale,slug}=await params;if(!isLocale(locale)||locale==="zh")return{};const product=await getPublishedProduct(slug);if(!product)return{};return{title:`${product.sku} ${product.title[locale]}`,description:product.summary[locale],alternates:{canonical:`/${locale}/products/${slug}`,languages:{zh:`/products/${slug}`,en:`/en/products/${slug}`,es:`/es/products/${slug}`,de:`/de/products/${slug}`,"x-default":`/products/${slug}`}}};}
export default async function Page({params}:{params:Promise<{locale:string;slug:string}>}){const {locale,slug}=await params;if(!isLocale(locale)||locale==="zh")notFound();const product=await getPublishedProduct(slug);if(!product)notFound();return <ProductPage product={product} locale={locale}/>;}
