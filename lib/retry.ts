/**
 * The Laravel API allows each IP 60 requests a minute across every /api route,
 * and answers 429 past that. A save or a cart change shouldn't fail on that —
 * it should just land a little later — so these calls wait it out and retry.
 * Not for OTP / login calls, whose 429 is a deliberate "slow down".
 */
const WAITS = [3000, 8000, 20000];

export async function fetchRetrying(url: string, init: RequestInit): Promise<Response> {
  for (let i = 0; ; i++) {
    const res = await fetch(url, init);
    if (res.status !== 429 || i >= WAITS.length) return res;
    /* Retry-After when the API exposes it (in seconds), else back off. */
    const after = Number(res.headers.get("retry-after"));
    const wait = after > 0 ? Math.min(after, 30) * 1000 : WAITS[i];
    await new Promise((r) => setTimeout(r, wait));
  }
}
