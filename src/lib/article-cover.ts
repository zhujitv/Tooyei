const allowedRemoteHosts = [
  "image.chukouplus.com",
] as const;

export function normalizeArticleCoverImage(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return null;
  if (normalized.startsWith("/") && !normalized.startsWith("//")) return normalized;
  try {
    const url = new URL(normalized);
    if (url.protocol !== "https:") return null;
    if (allowedRemoteHosts.includes(url.hostname as (typeof allowedRemoteHosts)[number]) && url.pathname.startsWith("/upload/C_4215/")) return url.toString();
    if (url.hostname.endsWith(".public.blob.vercel-storage.com") && !url.search) return url.toString();
    return null;
  } catch {
    return null;
  }
}
