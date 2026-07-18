import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { categoryErrorMessage, categoryReorderSchema } from "@/lib/category-schema";
import { getProductManagerSession } from "@/lib/admin-auth";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import { reorderCategories } from "@/lib/repositories/categories";
import { apiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const actor = await getProductManagerSession();
  if (!actor) return apiError(request, { code: "FORBIDDEN", message: "没有产品栏目管理权限。", status: 403, operation: "category.reorder" });

  try {
    const parsed = categoryReorderSchema.parse(await request.json());
    const result = await reorderCategories(parsed.parentId, parsed.orderedIds);
    await safeWriteAuditLog({
      actorEmail: actor.email,
      action: "category.reordered",
      entityType: "Category",
      metadata: result,
    });
    revalidatePath("/", "layout");
    revalidatePath("/admin/categories");
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return apiError(request, { code: "CATEGORY_REORDER_FAILED", message: categoryErrorMessage(error, "栏目排序失败。"), status: 400, operation: "category.reorder", error });
  }
}
