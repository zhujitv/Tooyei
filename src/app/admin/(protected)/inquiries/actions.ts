"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { InquiryStatus } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { updateInquiryStatus } from "@/lib/repositories/inquiries";

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "QUALIFIED", "IN_PROGRESS", "WON", "LOST", "SPAM"]),
});

export async function updateInquiryStatusAction(formData: FormData) {
  await requireAdminSession();

  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  if (!parsed.success) redirect("/admin/inquiries?error=validation");
  if (!isDatabaseConfigured()) redirect(`/admin/inquiries/${parsed.data.id}?error=database`);

  await updateInquiryStatus(parsed.data.id, InquiryStatus[parsed.data.status]);
  revalidatePath("/admin/content");
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${parsed.data.id}`);
  redirect(`/admin/inquiries/${parsed.data.id}?saved=1`);
}
