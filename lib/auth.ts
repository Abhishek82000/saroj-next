import { site } from "./site";

/**
 * OTP login against the storefront's JSON API — mobile → 4-digit OTP → a name
 * and email if the number is new. There is no password.
 *
 *   POST /api/auth/send-otp?mobile=<mobile>                                       → { status, message, challenge_token, is_registered }
 *   POST /api/auth/verify-otp?otp=<otp>&challenge_token=<challenge_token>          → { status, message, ... }
 *   POST /api/auth/register?name=<name>&email=<email>&registration_token=<token>  → { status, message, ... }
 *   GET  /api/auth/me                    [Authorization: Bearer <token>]           → { status, message, ... }
 *
 * Nothing here takes a JSON body — mobile, otp, challenge_token, name and
 * email all go as query params. send-otp hands back a `challenge_token` that
 * ties the OTP to that request; verify-otp wants it back as that same query
 * field (confirmed live: a Bearer header alone 422s "The challenge_token
 * field is required" — that was tried first and was wrong). register instead
 * wants that same token (verify-otp's own if it issues a fresh one, else the
 * original challenge_token) as the `registration_token` query param —
 * sending it expired or wrong 200s back a `status: "error"` ("Registration
 * session expired. Please verify your mobile again."), which `call` already
 * treats as a failure. verify-otp's `is_registered` says whether the number
 * already has an account — false means new, and it goes on to register. The
 * rest of verify-otp's and register's success payloads haven't been fully
 * seen, so they're read defensively (see `userFrom`, `loginFlag`).
 *
 * `me`, once logged in, takes the session as an Authorization: Bearer header
 * (confirmed live: no header 401s "Unauthenticated") — `order-view` (see
 * lib/orders.ts) checks out the same way. Any further logged-in call
 * (wishlist-on-the-server, …) should be checked live the same way before
 * assuming it follows either pattern; `authedGet`, below, is the shared GET
 * for whichever ones turn out to want a Bearer header.
 *
 * Set NEXT_PUBLIC_AUTH_MOCK=1 to develop against a localStorage stand-in
 * instead (no SMS is sent; the OTP is always 1234).
 */
export const AUTH_IS_MOCK = process.env.NEXT_PUBLIC_AUTH_MOCK === "1";
const MOCK_OTP = "1234";

export interface User {
  mobile: string;
  name: string;
  email: string;
  /** Whatever the API hands back to keep the session, once it hands one back. */
  token?: string;
}

export type Failure = { ok: false; message: string };
/** `token` belongs to this OTP and goes back to verifyOtp. */
export type SendOtpResult = { ok: true; token: string } | Failure;
export type VerifyOtpResult =
  | { ok: true; state: "existing"; user: User }
  /** A number with no account yet; `token` is what register needs. */
  | { ok: true; state: "new"; token: string }
  | Failure;
export type RegisterResult = { ok: true; user: User } | Failure;

export const isValidMobile = (m: string) => /^[6-9]\d{9}$/.test(m);
export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

/* ---------- the real API ---------- */

interface ApiBody {
  status?: string;
  message?: string;
  errors?: Record<string, string[]>;
  token?: string;
  access_token?: string;
  /** send-otp's session token; verify-otp takes it back as a Bearer header. */
  challenge_token?: string;
  /** verify-otp: whether this mobile already has an account. */
  is_registered?: boolean;
  user?: { name?: string; email?: string; mobile?: string };
  data?: { token?: string; access_token?: string; user?: { name?: string; email?: string; mobile?: string } };
}

/** `query` becomes the URL's query string (send-otp's `mobile`, verify-otp's
    `otp`); `token`, when given, goes as `Authorization: Bearer <token>` — every
    logged-in call takes its session that way, not as a field or query param.
    `body`, where still used (register), goes as JSON as before. `method`
    defaults to POST; the logged-in GETs (`me`, and whatever joins it) pass
    "GET" explicitly. */
async function call(
  path: string,
  opts: { method?: "GET" | "POST"; query?: Record<string, string>; token?: string; body?: object } = {},
): Promise<{ ok: true; json: ApiBody } | Failure> {
  try {
    const qs = opts.query ? `?${new URLSearchParams(opts.query)}` : "";
    const headers: Record<string, string> = { Accept: "application/json" };
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
    if (opts.body) headers["Content-Type"] = "application/json";
    const res = await fetch(`${site.url}/api/auth/${path}${qs}`, {
      method: opts.method ?? "POST",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const json: ApiBody = await res.json().catch(() => ({}));
    if (res.status === 429) return { ok: false, message: "Too many attempts — wait a minute and try again." };
    if (!res.ok || (json.status && json.status !== "success")) {
      const first = json.errors ? Object.values(json.errors)[0]?.[0] : undefined;
      return { ok: false, message: first ?? json.message ?? "Something went wrong — please try again." };
    }
    return { ok: true, json };
  } catch {
    return { ok: false, message: "Couldn't reach the server — check your connection." };
  }
}

/** First non-empty string under a key matching `re`, searching the response
    breadth-first a few levels deep — the profile may sit under `user`, `data`,
    `data.user`, and may call its fields `name` or `user_name`. */
function findString(root: unknown, re: RegExp): string | undefined {
  let level: unknown[] = [root];
  for (let depth = 0; depth < 4 && level.length; depth++) {
    const next: unknown[] = [];
    for (const node of level) {
      if (!node || typeof node !== "object" || Array.isArray(node)) continue;
      for (const [k, v] of Object.entries(node)) {
        if (typeof v === "string" && v.trim() && re.test(k)) return v.trim();
        if (v && typeof v === "object") next.push(v);
      }
    }
    level = next;
  }
  return undefined;
}

/** The signed-in user from whatever shape the API answers with. Fields it
    doesn't send fall back to what the visitor typed, or the mobile number. */
function userFrom(json: ApiBody, mobile: string, typed?: { name: string; email: string }, fallbackToken?: string): User {
  return {
    mobile,
    name: findString(json, /^(user_?|customer_?|full_?)?name$/i) || typed?.name || mobile,
    email: findString(json, /^(user_?|customer_?)?e-?mail$/i) || typed?.email || "",
    token: tokenOf(json) ?? fallbackToken,
  };
}

const tokenOf = (json: ApiBody) => json.token ?? json.access_token ?? json.data?.token ?? json.data?.access_token;

/** verify-otp's account flag: 1 = already registered, 0 = new. Reads the
    current API's `is_registered` boolean, and falls back to an older
    `login_status` 0/1 (top level or under `data`) in case that's what comes
    back instead. Undefined if neither is present. */
function loginFlag(json: ApiBody): 0 | 1 | undefined {
  if (typeof json.is_registered === "boolean") return json.is_registered ? 1 : 0;
  for (const scope of [json, json.data] as (Record<string, unknown> | undefined)[]) {
    if (!scope) continue;
    const key = Object.keys(scope).find((k) => /^login_?status$/i.test(k));
    if (key === undefined) continue;
    const n = Number(scope[key]);
    if (n === 0 || n === 1) return n;
  }
  return undefined;
}

/* ---------- a stand-in for developing without the backend ---------- */

const USERS_KEY = "saroj.mock.users";
const wait = (ms = 450) => new Promise<void>((r) => setTimeout(r, ms));
function readUsers(): Record<string, User> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(USERS_KEY) ?? "{}"); } catch { return {}; }
}

/* ---------- what the app calls ---------- */

export async function sendOtp(mobile: string): Promise<SendOtpResult> {
  if (!isValidMobile(mobile)) return { ok: false, message: "Enter a valid 10-digit mobile number." };
  if (AUTH_IS_MOCK) { await wait(); return { ok: true, token: "mock" }; }
  const r = await call("send-otp", { query: { mobile } });
  if (!r.ok) return r;
  const token = r.json.challenge_token ?? r.json.token ?? r.json.data?.token;
  return token ? { ok: true, token } : { ok: false, message: "Couldn't start the OTP — please try again." };
}

/** `token` is the challenge_token send-otp handed back — sent here as the
    `challenge_token` query field, same as `otp` (not a Bearer header — that
    422s; see the file header). */
export async function verifyOtp(mobile: string, otp: string, token: string): Promise<VerifyOtpResult> {
  if (AUTH_IS_MOCK) {
    await wait();
    if (otp !== MOCK_OTP) return { ok: false, message: "That OTP doesn't match — try again." };
    const user = readUsers()[mobile];
    return user ? { ok: true, state: "existing", user } : { ok: true, state: "new", token };
  }
  const r = await call("verify-otp", { query: { otp, challenge_token: token } });
  if (!r.ok) return r;
  if (process.env.NODE_ENV !== "production") console.info("[auth] verify-otp response", r.json);
  const next = tokenOf(r.json) ?? token;
  const flag = loginFlag(r.json);
  /* No login_status at all? Fall back to the web flow's wording ("new_register"). */
  const isNew = flag !== undefined ? flag === 0 : /new/i.test(r.json.message ?? "");
  return isNew
    ? { ok: true, state: "new", token: next }
    : { ok: true, state: "existing", user: userFrom(r.json, mobile, undefined, next) };
}

export async function registerUser(mobile: string, name: string, email: string, token: string): Promise<RegisterResult> {
  if (!name.trim()) return { ok: false, message: "Add your name." };
  if (!isValidEmail(email)) return { ok: false, message: "Enter a valid email address." };
  if (AUTH_IS_MOCK) {
    await wait();
    const user: User = { mobile, name: name.trim(), email: email.trim() };
    try { window.localStorage.setItem(USERS_KEY, JSON.stringify({ ...readUsers(), [mobile]: user })); } catch { /* ignore */ }
    return { ok: true, user };
  }
  const r = await call("register", { query: { name: name.trim(), email: email.trim(), registration_token: token } });
  return r.ok ? { ok: true, user: userFrom(r.json, mobile, { name: name.trim(), email: email.trim() }, token) } : r;
}

/**
 * The signed-in visitor's own profile — GET /api/auth/me, the session's
 * `token` as an Authorization: Bearer header. `mobile` is what to fall back
 * to (the number this session logged in with; `me`'s own payload hasn't been
 * seen, so it isn't assumed to send one back). Call this after login to
 * refresh the profile from the server, or anywhere the account screen needs
 * the current truth rather than what's cached in localStorage.
 */
export async function getMe(token: string, mobile: string): Promise<{ ok: true; user: User } | Failure> {
  if (AUTH_IS_MOCK) return { ok: false, message: "Not available in mock mode." };
  const r = await call("me", { method: "GET", token });
  return r.ok ? { ok: true, user: userFrom(r.json, mobile, undefined, token) } : r;
}

/** A GET under /api/auth/, Bearer-authenticated, for callers outside this
    file (lib/orders.ts and whatever joins it) — the same logged-in pattern
    as `me`, confirmed live for order-view too (no header: 401 "Unauthenticated",
    regardless of the id, so it's gated purely on the token). Returns the raw
    JSON; each caller shapes it into its own type, since none of these
    payloads have been seen with a real, valid token yet. */
export async function authedGet(path: string, token: string): Promise<{ ok: true; json: Record<string, unknown> } | Failure> {
  const r = await call(path, { method: "GET", token });
  return r.ok ? { ok: true, json: r.json as unknown as Record<string, unknown> } : r;
}
