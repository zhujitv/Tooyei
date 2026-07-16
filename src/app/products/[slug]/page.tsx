import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product-page";
import { getPublishedProduct, getPublishedProductSlugs } from "@/lib/repositories/products";

export const revalidate = 3600;
export async function generateStaticParams() { return (await getPublishedProductSlugs()).map((slug)=>({slug})); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{ const {slug}=await params; const product=await getPublishedProduct(slug); if(!product)return{}; return {title:`${product.sku} ${product.title.zh}`,description:product.summary.zh,alternates:{canonical:`/products/${slug}`,languages:{zh:`/products/${slug}`,en:`/en/products/${slug}`,es:`/es/products/${slug}`,de:`/de/products/${slug}`,"x-default":`/products/${slug}`}}}; }
export default async function Page({params}:{params:Promise<{slug:string}>}) { const {slug}=await params; const product=await getPublishedProduct(slug); if(!product)notFound(); return <ProductPage product={product} locale="zh"/>; }
