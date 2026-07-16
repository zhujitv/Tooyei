"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { InquiryStatus } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { updateInquiryFollowUp } from "@/lib/repositories/inquiries";

const followUpSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "QUALIFIED", "IN_PROGRESS", "WON", "LOST", "SPAM"]),
  assignedToId: z.string().optional(),
});

export async function updateInquiryFollowUpAction(formData: FormData) {
  await requireAdminSession();

  const parsed = followUpSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    assignedToId: formData.get("assignedToId") || undefined,
  });

  if (!parsed.success) redirect("/admin/inquiries?error=validation");
  if (!isDatabaseConfigured()) redirect(`/admin/inquiries/${parsed.data.id}?error=database`);

  await updateInquiryFollowUp(
    parsed.data.id,
    InquiryStatus[parsed.data.status],
    parsed.data.assignedToId || null,
  );
  revalidatePath("/admin/content");
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${parsed.data.id}`);
  redirect(`/admin/inquiries/${parsed.data.id}?saved=1`);
}
