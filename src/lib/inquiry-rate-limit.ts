import { createHash } from "node:crypto";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

type HeaderReader = {
  get(name: string): string | null;
};

type LimitSubject = {
  key: string;
  limit: number;
};

export type InquiryRateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: "ip" | "email";
      retryAfterSeconds: number;
    };

const oneHourMs = 60 * 60 * 1000;

const configuredLimit = (name: string, fallback: number) => {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const hashValue = (value: string) => createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

const firstHeaderValue = (headers: HeaderReader, name: string) =>
  headers
    .get(name)
    ?.split(",")
    .map((value) => value.trim())
    .find(Boolean) ?? null;

export const getRequestIp = (headers: HeaderReader) =>
  firstHeaderValue(headers, "x-forwarded-for") ||
  firstHeaderValue(headers, "x-real-ip") ||
  firstHeaderValue(headers, "cf-connecting-ip");

const retryAfter = (expiresAt: Date) =>
  Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));

async function consumeSubject(subject: LimitSubject): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number }> {
  const prisma = getPrisma();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + oneHourMs);

  const existing = await prisma.rateLimitCounter.findUnique({
    where: { key: subject.key },
    select: { id: true, count: true, expiresAt: true },
  });

  if (!existing || existing.expiresAt <= now) {
    await prisma.rateLimitCounter.upsert({
      where: { key: subject.key },
      update: { count: 1, expiresAt },
      create: { key: subject.key, count: 1, expiresAt },
    });
    return { allowed: true };
  }

  if (existing.count >= subject.limit) {
    return { allowed: false, retryAfterSeconds: retryAfter(existing.expiresAt) };
  }

  await prisma.rateLimitCounter.update({
    where: { key: subject.key },
    data: { count: { increment: 1 } },
  });

  return { allowed: true };
}

export async function consumeInquiryRateLimit({
  email,
  ip,
}: {
  email: string;
  ip?: string | null;
}): Promise<InquiryRateLimitResult> {
  if (!isDatabaseConfigured()) return { allowed: true };

  const subjects: Array<LimitSubject & { reason: "ip" | "email" }> = [];
  const ipLimit = configuredLimit("INQUIRY_IP_LIMIT_PER_HOUR", 8);
  const emailLimit = configuredLimit("INQUIRY_EMAIL_LIMIT_PER_HOUR", 3);

  if (ip) {
    subjects.push({
      reason: "ip",
      key: `inquiry:ip:${hashValue(ip)}`,
      limit: ipLimit,
    });
  }

  subjects.push({
    reason: "email",
    key: `inquiry:email:${hashValue(email)}`,
    limit: emailLimit,
  });

  await getPrisma().rateLimitCounter.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - oneHourMs) } },
  });

  for (const subject of subjects) {
    const result = await consumeSubject(subject);
    if (!result.allowed) {
      return { allowed: false, reason: subject.reason, retryAfterSeconds: result.retryAfterSeconds };
    }
  }

  return { allowed: true };
}
