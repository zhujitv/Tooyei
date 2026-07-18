import { apiError, apiSuccess } from "@/lib/api-response";
import { getPublicSiteSettings } from "@/lib/repositories/site-settings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const settings = await getPublicSiteSettings();
    return apiSuccess({ settings }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    return apiError(request, { code: "SITE_SETTINGS_UNAVAILABLE", message: "网站设置暂时不可用。", status: 500, operation: "site-settings.public", error });
  }
}
