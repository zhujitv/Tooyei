import { FolderTree, Languages, RefreshCw } from "lucide-react";
import { AdminCategoryManager } from "@/components/admin-category-manager";
import { getProductManagerSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getAdminCategoryTree } from "@/lib/repositories/categories";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [categories, managerSession] = await Promise.all([getAdminCategoryTree(), getProductManagerSession()]);

  return (
    <main className="admin-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium text-[#667085]">产品 / 栏目结构</p>
          <h1 className="mt-3 flex items-center gap-2.5 text-2xl font-semibold tracking-[-0.035em] text-[#172033]">
            <FolderTree className="size-6 text-[#475467]" />产品栏目管理
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#667085]">
            维护前台产品中心导航、栏目页面、多语言名称、SEO、层级、状态和排序。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-[#667085]">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E7EC] bg-white px-3 py-2"><Languages className="size-3.5" />4 种语言</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E7EC] bg-white px-3 py-2"><RefreshCw className="size-3.5" />前台动态同步</span>
        </div>
      </div>

      <div className="mt-6">
        <AdminCategoryManager
          initialCategories={categories}
          databaseReady={isDatabaseConfigured()}
          canManage={Boolean(managerSession)}
          serviceConfigured={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
        />
      </div>
    </main>
  );
}
