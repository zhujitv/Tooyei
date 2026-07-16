import { notFound } from "next/navigation";
import { ContactPage } from "@/components/contact-page";
import { isLocale } from "@/lib/site";
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale)||locale==="zh")notFound();return <ContactPage locale={locale}/>;}
