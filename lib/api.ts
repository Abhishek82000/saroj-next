/**
 * fetch() for the Laravel API, for every call the Next server makes.
 *
 * Why it exists: Laravel limits /api to a number of requests a minute per IP.
 * Every server render comes from this app's one IP, so a few visitors at once
 * used to use up that minute between them — the API answered 429 and pages
 * stalled, then came up empty or "not found" until a refresh. So:
 *
 * - Server-side, each call carries STOREFRONT_API_KEY (a server-only env var,
 *   never NEXT_PUBLIC_) in `X-Storefront-Key`; the API's rate limiter
 *   (RouteServiceProvider) lets calls with the matching key through unthrottled.
 *   In the browser no key is sent — visitors are limited per IP as before.
 * - Every call gives up after `timeout` ms instead of hanging the page.
 * - A GET that meets a 429 or a 502/503/504, or that can't connect, is retried
 *   a couple of times after a short pause (Retry-After when sent, capped).
 *
 * Only a 200 is ever stored by Next's data cache, so a failure is never cached.
 */
const SERVER_KEY = typeof window === "undefined" ? process.env.STOREFRONT_API_KEY ?? "" : "";
const RETRY_STATUS = new Set([429, 502, 503, 504]);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function apiFetch(
  url: string,
  init: RequestInit = {},
  { timeout = 15000, retries = 2 }: { timeout?: number; retries?: number } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (SERVER_KEY) headers.set("X-Storefront-Key", SERVER_KEY);
  const method = (init.method ?? "GET").toUpperCase();
  /* Retrying a POST could place an order or apply a coupon twice. */
  const tries = method === "GET" || method === "HEAD" ? retries : 0;

  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(timeout) });
    } catch (e) {
      /* A timeout or the caller's own abort is final; a dropped connection gets another go. */
      const aborted = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      if (aborted || attempt >= tries) throw e;
      await wait(500 * (attempt + 1));
      continue;
    }
    if (!RETRY_STATUS.has(res.status) || attempt >= tries) return res;
    const after = Number(res.headers.get("retry-after"));
    await wait(after > 0 ? Math.min(after, 3) * 1000 : 700 * (attempt + 1));
  }
}
