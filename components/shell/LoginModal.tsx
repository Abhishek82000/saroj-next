"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import { useStore } from "./StoreProvider";
import {
  isValidEmail, isValidMobile, registerUser, sendOtp, verifyOtp,
} from "@/lib/auth";

type Step = "mobile" | "otp" | "register";
const OTP_LEN = 4;
const RESEND_AFTER = 30;
const BANNER = "https://saroj-textile-store.b-cdn.net/media/90941782542541.webp";

/**
 * Login / Register in one modal, the way the storefront does it: mobile →
 * OTP → (new numbers only) name and email. Opened from the nav, or by any
 * action that needs an account — see `withLogin` in the store.
 */
export default function LoginModal() {
  const { loginOpen, loginReason, closeLogin, login } = useStore();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);
  /* Handed back by send-otp; verify-otp needs the same one. */
  const [otpToken, setOtpToken] = useState("");
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  /* A fresh modal every time it opens. */
  useEffect(() => {
    if (!loginOpen) return;
    setStep("mobile"); setMobile(""); setDigits(Array(OTP_LEN).fill(""));
    setName(""); setEmail(""); setError(""); setBusy(false); setWait(0);
  }, [loginOpen]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  useEffect(() => { if (step === "otp") boxes.current[0]?.focus(); }, [step]);

  const send = async () => {
    setError("");
    if (!isValidMobile(mobile)) return setError("Enter a valid 10-digit mobile number.");
    setBusy(true);
    const r = await sendOtp(mobile);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setOtpToken(r.token);
    setDigits(Array(OTP_LEN).fill(""));
    setWait(RESEND_AFTER);
    setStep("otp");
  };

  const verify = async (code = digits.join("")) => {
    setError("");
    if (code.length < OTP_LEN) return setError("Enter the 4-digit OTP.");
    setBusy(true);
    const r = await verifyOtp(mobile, code, otpToken);
    setBusy(false);
    if (!r.ok) { setDigits(Array(OTP_LEN).fill("")); boxes.current[0]?.focus(); return setError(r.message); }
    if (r.state === "existing") return login(r.user);
    setOtpToken(r.token);
    setStep("register");
  };

  const register = async () => {
    setError("");
    if (!name.trim()) return setError("Add your name.");
    if (!isValidEmail(email)) return setError("Enter a valid email address.");
    setBusy(true);
    const r = await registerUser(mobile, name, email, otpToken);
    setBusy(false);
    if (!r.ok) {
      /* The verified session is gone or wasn't recognised — the only way on is to verify the number again. */
      if (/expired|verify your mobile|user not found|invalid token/i.test(r.message)) setStep("mobile");
      return setError(r.message);
    }
    login(r.user);
  };

  const onDigit = (i: number, v: string) => {
    const raw = v.replace(/\D/g, "");
    /* Typing over a filled box replaces it rather than pushing a second digit in. */
    const d = digits[i] && raw.length === 2 ? raw[1] : raw;
    if (!d) return setDigits((cur) => cur.map((x, k) => (k === i ? "" : x)));
    const next = [...digits];
    d.slice(0, OTP_LEN - i).split("").forEach((ch, k) => { next[i + k] = ch; });
    setDigits(next);
    const at = Math.min(i + d.length, OTP_LEN - 1);
    boxes.current[at]?.focus();
    if (next.every(Boolean)) verify(next.join(""));
  };

  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) boxes.current[i - 1]?.focus();
  };

  const heading = step === "register" ? "Almost there" : step === "otp" ? "Verify your number" : "Login/Register";

  return (
    <Modal open={loginOpen} onClose={closeLogin} title="Log in or register" banner={
      /* The storefront's own login banner, which leads to the wholesale page. */
      // eslint-disable-next-line @next/next/no-img-element
      <Link href="/wholesale-fabric" onClick={closeLogin}>
        <img src={BANNER} alt="Our exclusive wholesale fabrics — minimum 10 m, starting @80" />
      </Link>}>
      <div className="st-login">
        <h3 className="st-login__h">{heading}</h3>
        {loginReason && step === "mobile" && <p className="st-login__why">{loginReason}</p>}

        {step === "mobile" && (
          <>
            <label className="st-field st-field--bare">
              <input type="tel" inputMode="numeric" maxLength={10} autoFocus value={mobile} placeholder="Enter Mobile Number *"
                aria-label="Mobile number" onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }} /></label>
            <button type="button" className="st-btn st-btn--solid w-full" disabled={busy} onClick={send}>
              {busy ? "Sending…" : "Send OTP"}
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <p className="st-lede" style={{ margin: 0 }}>
              We sent a 4-digit OTP to <b style={{ color: "var(--ink)" }}>+91 {mobile}</b>.{" "}
              <button type="button" className="st-login__link" onClick={() => { setStep("mobile"); setError(""); }}>Change</button>
            </p>
            <div className="st-otp" role="group" aria-label="One-time password">
              {digits.map((d, i) => (
                <input key={i} ref={(el) => { boxes.current[i] = el; }} value={d} inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"} maxLength={OTP_LEN} aria-label={`Digit ${i + 1}`}
                  onChange={(e) => onDigit(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} />
              ))}
            </div>
            <button type="button" className="st-btn st-btn--solid w-full" disabled={busy} onClick={() => verify()}>
              {busy ? "Verifying…" : "Verify OTP"}
            </button>
            <p className="st-login__resend">
              {wait > 0
                ? `Resend OTP in ${wait}s`
                : <button type="button" className="st-login__link" disabled={busy} onClick={send}>Resend OTP</button>}
            </p>
          </>
        )}

        {step === "register" && (
          <>
            <p className="st-lede" style={{ margin: 0 }}>Welcome! Two details and you’re in.</p>
            <label className="st-field" style={{ marginTop: "1.1rem" }}><span>Your name</span>
              <input type="text" autoFocus value={name} placeholder="Priya Sharma" onChange={(e) => setName(e.target.value)} /></label>
            <label className="st-field"><span>Email</span>
              <input type="email" value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") register(); }} /></label>
            <button type="button" className="st-btn st-btn--solid w-full" disabled={busy} onClick={register}>
              {busy ? "Registering…" : "Register"}
            </button>
          </>
        )}

        {error && <p className="st-login__err" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
