import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getProductManagerSession, getTranslationManagerSession } from "@/lib/admin-auth";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import {
  cancelProductTranslationJob,
  closeProductTranslationJob,
  deleteProductTranslationJob,
  restoreProductTranslationJob,
  retryFailedProductTranslationJobItems,
} from "@/lib/repositories/product-translation-jobs";
import { apiError } from "@/lib/api-response";

const idSchema = z.string().min(1).max(120);
const mutationSchema = z.object({ action: z.enum(["STOP", "REQUEUE_FAILED", "CLOSE", "RESTORE"]) });

const parseId = async (context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  return idSchema.safeParse(id);
};

const refresh = (id: string) => {
  revalidatePath("/admin/translations");
  revalidatePath(`/admin/translations/${id}`);
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getTranslationManagerSession();
  if (!session) return apiError(request, { code: "FORBIDDEN", message: "无权管理翻译任务。", status: 403, operation: "translation.mutate" });
  const parsedId = await parseId(context);
  if (!parsedId.success) return apiError(request, { code: "INVALID_JOB", message: "无效的翻译任务。", status: 400, operation: "translation.mutate" });
  const parsed = mutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(request, { code: "INVALID_ACTION", message: "无效的任务操作。", status: 400, operation: "translation.mutate" });

  try {
    const result = parsed.data.action === "STOP"
      ? await cancelProductTranslationJob(parsedId.data)
      : parsed.data.action === "REQUEUE_FAILED"
        ? await retryFailedProductTranslationJobItems(parsedId.data)
        : parsed.data.action === "CLOSE"
          ? await closeProductTranslationJob(parsedId.data)
          : await restoreProductTranslationJob(parsedId.data);
    await safeWriteAuditLog({
      actorEmail: session.email,
      action: `product_translation_job.${parsed.data.action.toLowerCase()}`,
      entityType: "ProductTranslationJob",
      entityId: parsedId.data,
      metadata: parsed.data.action === "REQUEUE_FAILED" && "count" in result ? { queued: result.count } : undefined,
    });
    refresh(parsedId.data);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "翻译任务操作失败。";
    return apiError(request, { code: "TRANSLATION_MUTATION_FAILED", message, status: 409, operation: "translation.mutate", error });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getProductManagerSession();
  if (!session) return apiError(request, { code: "FORBIDDEN", message: "只有管理员可以删除翻译任务。", status: 403, operation: "translation.delete" });
  const parsedId = await parseId(context);
  if (!parsedId.success) return apiError(request, { code: "INVALID_JOB", message: "无效的翻译任务。", status: 400, operation: "translation.delete" });

  try {
    const result = await deleteProductTranslationJob(parsedId.data);
    await safeWriteAuditLog({
      actorEmail: session.email,
      action: "product_translation_job.deleted",
      entityType: "ProductTranslationJob",
      entityId: parsedId.data,
      metadata: result,
    });
    refresh(parsedId.data);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除翻译任务失败。";
    return apiError(request, { code: "TRANSLATION_DELETE_FAILED", message, status: 409, operation: "translation.delete", error });
  }
}
