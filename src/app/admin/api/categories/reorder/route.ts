import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { categoryErrorMessage, categoryReorderSchema } from "@/lib/category-schema";
import { getProductManagerSession } from "@/lib/admin-auth";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import { reorderCategories } from "@/lib/repositories/categories";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const actor = await getProductManagerSession();
  if (!actor) return NextResponse.json({ ok: false, error: "没有产品栏目管理权限。" }, { status: 403 });

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
    return NextResponse.json(
      { ok: false, error: categoryErrorMessage(error, "栏目排序失败。") },
      { status: 400 },
    );
  }
}
