import type { AdminInquiryDetail } from "@/lib/repositories/inquiries";

type SendInquiryNotificationResult =
  | { status: "skipped"; reason: "missing-api-key" | "missing-recipient" }
  | { status: "sent"; id?: string }
  | { status: "failed"; reason: string };

const resendEndpoint = "https://api.resend.com/emails";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const recipients = () =>
  process.env.INQUIRY_NOTIFICATION_EMAIL
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean) ?? [];

const fromAddress = () => process.env.RESEND_FROM_EMAIL || "Tooyei <onboarding@resend.dev>";

const siteOrigin = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || "https://tooyei.vercel.app").replace(/\/$/, "");

const field = (label: string, value?: string | null) =>
  `<tr><td style="padding:8px 0;color:#6b7280;width:140px;">${label}</td><td style="padding:8px 0;color:#111827;">${escapeHtml(value || "—")}</td></tr>`;

const buildHtml = (inquiry: AdminInquiryDetail) => {
  const adminUrl = `${siteOrigin()}/admin/inquiries/${inquiry.id}`;
  const products = inquiry.productLabels.length > 0 ? inquiry.productLabels.join(", ") : "General request";

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f5f1;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e7e0d6;">
            <tr>
              <td>
                <p style="margin:0 0 8px;color:#b68a4c;font-size:12px;font-weight:700;letter-spacing:.14em;">TOOYEI INQUIRY</p>
                <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">New website inquiry</h1>
                <p style="margin:0 0 24px;color:#6b7280;line-height:1.6;">A visitor submitted the public inquiry form. Open the admin page to assign ownership and continue follow-up.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #eee7dd;border-bottom:1px solid #eee7dd;padding:12px 0;margin-bottom:24px;">
                  ${field("Name", inquiry.name)}
                  ${field("Email", inquiry.email)}
                  ${field("Phone", inquiry.phone)}
                  ${field("Company", inquiry.company)}
                  ${field("Country", inquiry.country)}
                  ${field("Products", products)}
                  ${field("Source", inquiry.sourcePath)}
                </table>
                <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Message</p>
                <div style="white-space:pre-wrap;margin:0 0 24px;padding:16px;border-radius:12px;background:#f8f7f4;color:#111827;line-height:1.6;">${escapeHtml(inquiry.message)}</div>
                <a href="${adminUrl}" style="display:inline-block;background:#0b1220;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Open inquiry</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export async function sendInquiryNotification(inquiry: AdminInquiryDetail): Promise<SendInquiryNotificationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = recipients();

  if (!apiKey) return { status: "skipped", reason: "missing-api-key" };
  if (to.length === 0) return { status: "skipped", reason: "missing-recipient" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(resendEndpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `tooyei-inquiry-${inquiry.id}`,
      },
      body: JSON.stringify({
        from: fromAddress(),
        to,
        reply_to: inquiry.email,
        subject: `New Tooyei inquiry: ${inquiry.name}`,
        html: buildHtml(inquiry),
      }),
    });

    const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;

    if (!response.ok) {
      return { status: "failed", reason: payload?.message || `Resend returned ${response.status}` };
    }

    return { status: "sent", id: payload?.id };
  } catch (error) {
    return { status: "failed", reason: error instanceof Error ? error.message : "Unknown email error" };
  } finally {
    clearTimeout(timeout);
  }
}
