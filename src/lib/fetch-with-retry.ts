export type FetchWithRetryOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
};

const retryableStatus = (status: number) => status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
const safeMethod = (method?: string) => !method || ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function fetchWithRetry(
  input: RequestInfo | URL,
  { timeoutMs = 15_000, retries = 2, retryDelayMs = 350, signal, ...init }: FetchWithRetryOptions = {},
): Promise<Response> {
  const canRetryNetworkFailure = safeMethod(init.method);
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const abort = () => controller.abort(signal?.reason);
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(() => controller.abort(new DOMException(`Request timed out after ${timeoutMs}ms`, "TimeoutError")), timeoutMs);

    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      if (attempt < retries && retryableStatus(response.status)) {
        await response.body?.cancel().catch(() => undefined);
        await wait(retryDelayMs * (2 ** attempt));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (signal?.aborted || attempt >= retries || !canRetryNetworkFailure) throw error;
      await wait(retryDelayMs * (2 ** attempt));
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Network request failed.");
}
