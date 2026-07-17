import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTranslationManagerSession } from "@/lib/admin-auth";
import {
  processNextProductTranslationJobItem,
  getOrStartProductTranslationJobExecution,
} from "@/lib/repositories/product-translation-jobs";
import { contentLocales, localizedPath } from "@/lib/site";

export const maxDuration = 120;

const idSchema = z.string().min(1).max(120);
const bodySchema = z.object({ executionId: z.string().uuid().optional() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getTranslationManagerSession();
  if (!session) return NextResponse.json({ ok: false, error: "无权执行翻译任务。" }, { status: 403 });

  const { id } = await context.params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return NextResponse.json({ ok: false, error: "无效的翻译任务。" }, { status: 400 });
  const parsedBody = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsedBody.success) return NextResponse.json({ ok: false, error: "无效的执行凭证。" }, { status: 400 });

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
    console.error("Process translation job failed", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "翻译任务执行失败。" },
      { status: 400 },
    );
  }
}
