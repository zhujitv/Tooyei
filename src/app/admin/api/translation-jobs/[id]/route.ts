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
  if (!session) return NextResponse.json({ ok: false, error: "无权管理翻译任务。" }, { status: 403 });
  const parsedId = await parseId(context);
  if (!parsedId.success) return NextResponse.json({ ok: false, error: "无效的翻译任务。" }, { status: 400 });
  const parsed = mutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "无效的任务操作。" }, { status: 400 });

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
    console.error("Translation job mutation failed", parsed.data.action, message);
    return NextResponse.json({ ok: false, error: message }, { status: 409 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getProductManagerSession();
  if (!session) return NextResponse.json({ ok: false, error: "只有管理员可以删除翻译任务。" }, { status: 403 });
  const parsedId = await parseId(context);
  if (!parsedId.success) return NextResponse.json({ ok: false, error: "无效的翻译任务。" }, { status: 400 });

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
    console.error("Delete translation job failed", message);
    return NextResponse.json({ ok: false, error: message }, { status: 409 });
  }
}
