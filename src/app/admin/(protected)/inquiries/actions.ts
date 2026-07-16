"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { InquiryNoteKind, InquiryStatus } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import { createInquiryNote, updateInquiryFollowUp } from "@/lib/repositories/inquiries";

const followUpSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "QUALIFIED", "IN_PROGRESS", "WON", "LOST", "SPAM"]),
  assignedToId: z.string().optional(),
});

const noteSchema = z.object({
  inquiryId: z.string().min(1),
  kind: z.enum(["GENERAL", "CALL", "EMAIL", "WHATSAPP", "QUOTE", "SAMPLE", "MEETING", "OTHER"]),
  body: z.string().trim().min(2).max(2000),
  nextFollowUpAt: z.string().optional(),
});

const parseNextFollowUpAt = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export async function updateInquiryFollowUpAction(formData: FormData) {
  const session = await requireAdminSession();

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
  await safeWriteAuditLog({
    actorEmail: session.email,
    action: "inquiry.follow_up_updated",
    entityType: "Inquiry",
    entityId: parsed.data.id,
    metadata: {
      status: parsed.data.status,
      assignedToId: parsed.data.assignedToId || null,
    },
  });
  revalidatePath("/admin/content");
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${parsed.data.id}`);
  redirect(`/admin/inquiries/${parsed.data.id}?saved=followup`);
}

export async function createInquiryNoteAction(formData: FormData) {
  const session = await requireAdminSession();

  const parsed = noteSchema.safeParse({
    inquiryId: formData.get("inquiryId"),
    kind: formData.get("kind"),
    body: formData.get("body"),
    nextFollowUpAt: formData.get("nextFollowUpAt") || undefined,
  });

  if (!parsed.success) redirect("/admin/inquiries?error=validation");
  if (!isDatabaseConfigured()) redirect(`/admin/inquiries/${parsed.data.inquiryId}?error=database`);

  const nextFollowUpAt = parseNextFollowUpAt(parsed.data.nextFollowUpAt);
  if (nextFollowUpAt === undefined) redirect(`/admin/inquiries/${parsed.data.inquiryId}?error=note`);

  const note = await createInquiryNote({
    inquiryId: parsed.data.inquiryId,
    actorEmail: session.email,
    kind: InquiryNoteKind[parsed.data.kind],
    body: parsed.data.body,
    nextFollowUpAt,
  });

  await safeWriteAuditLog({
    actorEmail: session.email,
    action: "inquiry.note_created",
    entityType: "Inquiry",
    entityId: parsed.data.inquiryId,
    metadata: {
      noteId: note.id,
      kind: parsed.data.kind,
      nextFollowUpAt: nextFollowUpAt?.toISOString() ?? null,
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${parsed.data.inquiryId}`);
  redirect(`/admin/inquiries/${parsed.data.inquiryId}?saved=note`);
}
