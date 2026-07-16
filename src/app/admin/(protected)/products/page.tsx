import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database, Languages } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isDatabaseConfigured } from "@/lib/db";
import { getAdminProducts } from "@/lib/repositories/admin-products";
import { locales } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Products administration", robots: { index: false, follow: false } };

const statusColor: Record<string, string> = {
  PUBLISHED: "bg-emerald-500/12 text-emerald-300",
  NEEDS_REVIEW: "bg-amber-500/12 text-amber-300",
  MACHINE_DRAFT: "bg-sky-500/12 text-sky-300",
  MISSING: "bg-white/8 text-white/35",
};

export default async function AdminProductsPage() {
  const databaseReady = isDatabaseConfigured();
  const products = await getAdminProducts();

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="text-xs font-bold tracking-[0.18em] text-[#d56a5d]">CATALOGUE</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">Products</h1><p className="mt-3 text-sm text-white/45">Review product content and control which translations are published.</p></div>
        <Badge className={databaseReady ? "bg-emerald-600" : "bg-amber-600"}><Database className="size-3.5" />{databaseReady ? "Editing enabled" : "Read-only samples"}</Badge>
      </div>

      {!databaseReady && <Alert className="mt-8 border-amber-500/30 bg-amber-500/8 text-amber-100"><Database className="size-4"/><AlertTitle>Database required for saving</AlertTitle><AlertDescription className="text-amber-100/65">You can inspect the complete editing workflow now. Saving becomes available automatically after PostgreSQL is configured and seeded.</AlertDescription></Alert>}

      <Card className="mt-8 border-white/10 bg-[#1a1e1a] text-white shadow-none">
        <CardHeader><CardTitle className="flex items-center gap-2"><Languages className="size-5 text-[#d56a5d]"/>Translation inventory</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow className="border-white/10 hover:bg-transparent"><TableHead className="text-white/45">Product</TableHead><TableHead className="text-white/45">SKU</TableHead><TableHead className="text-white/45">Type</TableHead>{locales.map((locale)=><TableHead key={locale} className="text-white/45">{locale.toUpperCase()}</TableHead>)}<TableHead /></TableRow></TableHeader>
            <TableBody>{products.map((product)=><TableRow key={product.slug} className="border-white/10 hover:bg-white/[0.03]"><TableCell className="max-w-72 font-medium">{product.title}</TableCell><TableCell className="font-mono text-white/55">{product.sku}</TableCell><TableCell>{product.category}</TableCell>{locales.map((locale)=><TableCell key={locale}><Badge className={statusColor[product.translationStates[locale]]}>{product.translationStates[locale].replaceAll("_"," ")}</Badge></TableCell>)}<TableCell className="text-right"><Button asChild size="sm" variant="ghost" className="text-white/60 hover:bg-white/10 hover:text-white"><Link href={`/admin/products/${product.slug}`}>Edit<ArrowRight/></Link></Button></TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
