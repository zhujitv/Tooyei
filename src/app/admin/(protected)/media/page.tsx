import { AssetType } from "@/generated/prisma/client";
import { Images } from "lucide-react";
import { AdminMediaCenter } from "@/components/admin-media-center";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assetTypeLabels } from "@/lib/media-asset-policy";
import { listMediaAssetProductOptions, listMediaAssets } from "@/lib/repositories/media-assets";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; productId?: string }> }) {
  const filters = await searchParams;
  const type = filters.type && Object.values(AssetType).includes(filters.type as AssetType) ? filters.type as AssetType : undefined;
  const [assets, products] = await Promise.all([listMediaAssets({ q: filters.q, type, productId: filters.productId, limit: 200 }), listMediaAssetProductOptions()]);
  return <main className="admin-page space-y-6">
    <div><p className="text-sm text-slate-500">内容资源</p><h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-950"><Images className="size-6 text-blue-600" />媒体中心</h1><p className="mt-2 max-w-3xl text-sm text-slate-600">集中管理全部图片、视频和文件，查看引用关系并复用已有资源。</p></div>
    <form className="admin-card grid gap-3 rounded-xl p-4 lg:grid-cols-[1fr_190px_260px_auto]">
      <Input name="q" defaultValue={filters.q} placeholder="搜索文件名" className="admin-field" />
      <select name="type" defaultValue={type || ""} className="admin-select px-3"><option value="">全部类型</option>{Object.values(AssetType).map((value) => <option key={value} value={value}>{assetTypeLabels[value]}</option>)}</select>
      <select name="productId" defaultValue={filters.productId || ""} className="admin-select px-3"><option value="">全部产品</option>{products.map((product) => <option key={product.id} value={product.id}>{product.label}</option>)}</select>
      <Button type="submit" className="admin-button-primary">筛选</Button>
    </form>
    <AdminMediaCenter assets={assets} serviceConfigured={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />
  </main>;
}
