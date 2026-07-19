import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { checkDatabaseHealth } from "@/lib/database-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({
      connected: false,
      status: "unauthorized",
      message: "Authentication required",
    }, {
      status: 401,
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  }

  const health = await checkDatabaseHealth();
  return NextResponse.json({
    connected: health.connected,
    status: health.status,
    message: health.message,
    checkedAt: health.checkedAt,
  }, {
    status: health.connected ? 200 : 503,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
