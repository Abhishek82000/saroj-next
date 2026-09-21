import { site } from "./site";

/**
 * OTP login against the storefront's JSON API — mobile → 4-digit OTP → a name
 * and email if the number is new. There is no password.
 *
 *   POST /api/auth/send-otp    { mobile }               → { status, message, token }
 *   POST /api/auth/verify-otp  { mobile, otp, token }   → { status, message, login_status, ... }
 *   POST /api/auth/register    { name, email, token }   → { status, message, ... }
 *
 * send-otp hands back a `token` that ties the OTP to that request; verify-otp
 * must be sent the same one (without it: 422 "The token field is required").
 * verify-otp's `login_status` says whether the number already has an account:
 * 1 = yes, 0 = new — and a new one goes on to register, with the token of the
 * verified session (a fresh one from verify-otp if it sends one, else the same).
 * The rest of verify-otp's and register's payloads haven't been seen, so they're
 * read defensively (see `userFrom`, `loginFlag`).
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
  user?: { name?: string; email?: string; mobile?: string };
  data?: { token?: string; access_token?: string; user?: { name?: string; email?: string; mobile?: string } };
}

async function call(path: string, body: object): Promise<{ ok: true; json: ApiBody } | Failure> {
  try {
    const res = await fetch(`${site.url}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
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

/** verify-otp's login_status: 1 = already registered, 0 = new. Read from the top
    level or `data`, tolerating camelCase and "1"/"0" strings; undefined if absent. */
function loginFlag(json: ApiBody): 0 | 1 | undefined {
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
  const r = await call("send-otp", { mobile });
  if (!r.ok) return r;
  const token = r.json.token ?? r.json.data?.token;
  return token ? { ok: true, token } : { ok: false, message: "Couldn't start the OTP — please try again." };
}

export async function verifyOtp(mobile: string, otp: string, token: string): Promise<VerifyOtpResult> {
  if (AUTH_IS_MOCK) {
    await wait();
    if (otp !== MOCK_OTP) return { ok: false, message: "That OTP doesn't match — try again." };
    const user = readUsers()[mobile];
    return user ? { ok: true, state: "existing", user } : { ok: true, state: "new", token };
  }
  const r = await call("verify-otp", { mobile, otp, token });
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
  const r = await call("register", { name: name.trim(), email: email.trim(), token });
  return r.ok ? { ok: true, user: userFrom(r.json, mobile, { name: name.trim(), email: email.trim() }, token) } : r;
}
