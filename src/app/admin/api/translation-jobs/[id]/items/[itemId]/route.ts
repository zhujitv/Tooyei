import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/api-response";
import { getTranslationManagerSession } from "@/lib/admin-auth";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import { revalidateProductTranslationJobItem, retryProductTranslationJobItem } from "@/lib/repositories/product-translation-jobs";

const idSchema = z.string().min(1).max(120);
const mutationSchema = z.object({ action: z.enum(["REVALIDATE", "REQUEUE"]) });

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  const session = await getTranslationManagerSession();
  if (!session) return apiError(request, { code: "FORBIDDEN", message: "无权重新质检翻译任务。", status: 403, operation: "translation.item-revalidate" });
  const params = await context.params;
  const jobId = idSchema.safeParse(params.id);
  const itemId = idSchema.safeParse(params.itemId);
  const body = mutationSchema.safeParse(await request.json().catch(() => null));
  if (!jobId.success || !itemId.success || !body.success) {
    return apiError(request, { code: "INVALID_REQUEST", message: "无效的重新质检请求。", status: 400, operation: "translation.item-revalidate" });
  }

  try {
    if (body.data.action === "REQUEUE") {
      const result = await retryProductTranslationJobItem(jobId.data, itemId.data);
      await safeWriteAuditLog({
        actorEmail: session.email,
        action: "product_translation_job_item.requeued",
        entityType: "ProductTranslationJobItem",
        entityId: itemId.data,
        metadata: { jobId: jobId.data, queued: result.count },
      });
      revalidatePath("/admin/translations");
      revalidatePath(`/admin/translations/${jobId.data}`);
      return NextResponse.json({ ok: true, result });
    }
    const result = await revalidateProductTranslationJobItem(jobId.data, itemId.data);
    await safeWriteAuditLog({
      actorEmail: session.email,
      action: "product_translation_job_item.revalidated",
      entityType: "ProductTranslationJobItem",
      entityId: itemId.data,
      metadata: { jobId: jobId.data, qaStatus: result.status, issueCount: result.issues.length },
    });
    revalidatePath("/admin/translations");
    revalidatePath(`/admin/translations/${jobId.data}`);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return apiError(request, {
      code: "TRANSLATION_REVALIDATE_FAILED",
      message: error instanceof Error ? error.message : "重新质检失败。",
      status: 409,
      operation: "translation.item-revalidate",
      error,
    });
  }
}
