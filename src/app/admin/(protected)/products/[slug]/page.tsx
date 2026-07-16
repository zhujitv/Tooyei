import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Database, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isDatabaseConfigured } from "@/lib/db";
import { getAdminProduct } from "@/lib/repositories/admin-products";
import { languageNames } from "@/lib/site";
import { updateProductTranslationAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit product translations", robots: { index: false, follow: false } };
const statuses = ["MISSING", "MACHINE_DRAFT", "NEEDS_REVIEW", "PUBLISHED"] as const;

export default async function AdminProductEditPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { slug } = await params;
  const feedback = await searchParams;
  const product = await getAdminProduct(slug);
  if (!product) notFound();
  const databaseReady = isDatabaseConfigured();
  const saveAction = updateProductTranslationAction.bind(null, slug);

  return <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8 lg:py-14">
    <Button asChild variant="ghost" className="-ml-3 text-white/60 hover:bg-white/10 hover:text-white"><Link href="/admin/products"><ArrowLeft/>Products</Link></Button>
    <div className="mt-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="font-mono text-xs tracking-[0.16em] text-[#d56a5d]">{product.sku} · {product.category}</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Translation editor</h1></div><Badge className={databaseReady ? "bg-emerald-600" : "bg-amber-600"}><Database className="size-3.5"/>{databaseReady ? "Saving enabled" : "Read-only"}</Badge></div>
    {feedback.saved && <Alert className="mt-7 border-emerald-500/30 bg-emerald-500/8 text-emerald-100"><Save className="size-4"/><AlertTitle>Translation saved</AlertTitle><AlertDescription className="text-emerald-100/65">The {feedback.saved.toUpperCase()} version and public page cache were updated.</AlertDescription></Alert>}
    {feedback.error && <Alert className="mt-7 border-amber-500/30 bg-amber-500/8 text-amber-100"><Database className="size-4"/><AlertTitle>Changes were not saved</AlertTitle><AlertDescription className="text-amber-100/65">{feedback.error === "database" ? "Connect PostgreSQL and seed the catalogue before saving." : "Review the title, summary and publishing state."}</AlertDescription></Alert>}
    <div className="mt-8 space-y-6">{product.translations.map((translation)=><Card key={translation.locale} className="border-white/10 bg-[#1a1e1a] text-white shadow-none"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>{languageNames[translation.locale]}</CardTitle><Badge variant="outline" className="border-white/15 text-white/60">{translation.status.replaceAll("_"," ")}</Badge></CardHeader><CardContent><form action={saveAction} className="space-y-5"><input type="hidden" name="locale" value={translation.locale}/><div className="space-y-2"><Label htmlFor={`${translation.locale}-title`}>Title</Label><Input id={`${translation.locale}-title`} name="title" defaultValue={translation.title} minLength={3} maxLength={180} required disabled={!databaseReady} className="border-white/10 bg-black/20 disabled:opacity-60"/></div><div className="space-y-2"><Label htmlFor={`${translation.locale}-summary`}>Summary</Label><Textarea id={`${translation.locale}-summary`} name="summary" defaultValue={translation.summary} minLength={20} maxLength={800} required disabled={!databaseReady} className="min-h-28 border-white/10 bg-black/20 disabled:opacity-60"/></div><div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end"><div className="space-y-2"><Label htmlFor={`${translation.locale}-status`}>Publishing state</Label><select id={`${translation.locale}-status`} name="status" defaultValue={translation.status} disabled={!databaseReady} className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm disabled:opacity-60">{statuses.map((status)=><option key={status} value={status}>{status.replaceAll("_"," ")}</option>)}</select></div><Button type="submit" disabled={!databaseReady} className="bg-[#a63429] hover:bg-[#8d2b23]"><Save/>Save {translation.locale.toUpperCase()}</Button></div></form></CardContent></Card>)}</div>
  </main>;
}
