import "server-only";

import type { Metadata } from "next";
import { logError } from "@/lib/observability";

export async function safeMetadata(
  operation: string,
  build: () => Promise<Metadata> | Metadata,
  fallback: Metadata = {},
): Promise<Metadata> {
  try {
    return (await build()) ?? fallback;
  } catch (error) {
    logError("Metadata generation failed; fallback returned", { operation }, error);
    return fallback;
  }
}
