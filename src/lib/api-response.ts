import { NextResponse } from "next/server";
import { logError, requestIdFrom } from "@/lib/observability";

export type ApiErrorBody = {
  ok: false;
  error: string;
  code: string;
  requestId: string;
};

export const apiSuccess = <T extends Record<string, unknown>>(
  data: T,
  init?: ResponseInit,
) => NextResponse.json({ ok: true, ...data }, init);

export function apiError(
  request: Request | undefined,
  options: {
    code: string;
    message: string;
    status: number;
    operation: string;
    error?: unknown;
  },
) {
  const requestId = requestIdFrom(request);
  if (options.error !== undefined || options.status >= 500) {
    logError(options.message, {
      operation: options.operation,
      requestId,
      route: request ? new URL(request.url).pathname : undefined,
      status: options.status,
      code: options.code,
    }, options.error ?? new Error(options.message));
  }
  return NextResponse.json<ApiErrorBody>(
    { ok: false, error: options.message, code: options.code, requestId },
    { status: options.status, headers: { "x-request-id": requestId } },
  );
}

export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message.trim() ? error.message : fallback;
