import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTranslationManagerSession } from "@/lib/admin-auth";
import {
  processNextProductTranslationJobItem,
  getOrStartProductTranslationJobExecution,
} from "@/lib/repositories/product-translation-jobs";
import { contentLocales, localizedPath } from "@/lib/site";
import { apiError } from "@/lib/api-response";

export const maxDuration = 120;

const idSchema = z.string().min(1).max(120);
const bodySchema = z.object({ executionId: z.string().uuid().optional() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getTranslationManagerSession();
  if (!session) return apiError(request, { code: "FORBIDDEN", message: "无权执行翻译任务。", status: 403, operation: "translation.run" });

  const { id } = await context.params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return apiError(request, { code: "INVALID_JOB", message: "无效的翻译任务。", status: 400, operation: "translation.run" });
  const parsedBody = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsedBody.success) return apiError(request, { code: "INVALID_EXECUTION", message: "无效的执行凭证。", status: 400, operation: "translation.run" });

  try {
    const executionId = parsedBody.data.executionId
      ?? (await getOrStartProductTranslationJobExecution(parsedId.data, session.email)).executionId;
    const result = await processNextProductTranslationJobItem(parsedId.data, executionId);
    revalidatePath("/admin/translations");
    revalidatePath(`/admin/translations/${parsedId.data}`);
    if (result.processed && result.productSlug) {
      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${result.productSlug}`);
      revalidatePath(`/products/${result.productSlug}`);
      for (const locale of contentLocales) {
        revalidatePath(localizedPath(locale, `/products/${result.productSlug}`));
      }
    }
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return apiError(request, { code: "TRANSLATION_RUN_FAILED", message: error instanceof Error ? error.message : "翻译任务执行失败。", status: 400, operation: "translation.run", error });
  }
}
