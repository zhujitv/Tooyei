import { apiError, apiSuccess } from "@/lib/api-response";
import { getPublicSocialLinks } from "@/lib/repositories/social-links";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const links = await getPublicSocialLinks();
    return apiSuccess({ links }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    return apiError(request, { code: "SOCIAL_LINKS_UNAVAILABLE", message: "社媒链接暂时不可用。", status: 500, operation: "social-links.public", error });
  }
}
