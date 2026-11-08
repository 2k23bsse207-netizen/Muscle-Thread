
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import AuthLayout, { inputCls } from "./Authlayout";
import { resendVerificationRequest, verifyRequest } from "../../lib/api";

const heroImage = "/images/auth-hero.png";

const label = "text-xs sm:text-[13px] font-medium";

const submitBtn =
  "group flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 py-3 sm:py-3.5 text-sm font-semibold text-white transition hover:gap-3 active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-950";

// Carried from signup: the guarded-route redirect (`from`) plus the email we
// just signed up with, which the resend endpoint needs.
type VerifyState = {
  from?: { pathname?: string; search?: string };
  email?: string;
} | null;

export default function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as VerifyState;
  const email = state?.email ?? "";

  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

  // Success message first, then continue to Login — still carrying `from`, so
  // a checkout guard's destination survives signup → verify → login.
  useEffect(() => {
    if (!verified) return;
    const timer = window.setTimeout(
      () => navigate("/login", { state: location.state, replace: true }),
      1500,
    );
    return () => window.clearTimeout(timer);
  }, [verified, navigate, location.state]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!code.trim()) {
      setMsg("Enter the code from your email.");
      return;
    }

    setMsg("");
    setBusy(true);

    try {
      await verifyRequest(code.trim());
      setResent(false);
      setVerified(true);
    } catch (err: unknown) {
      setMsg(
        err instanceof Error
          ? err.message
          : "That code didn't work. Check it and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setMsg("");
    setResent(false);
    setResendBusy(true);

    try {
      await resendVerificationRequest(email);
      setResent(true);
    } catch (err: unknown) {
      setMsg(
        err instanceof Error
          ? err.message
          : "We couldn't resend the code. Try again.",
      );
    } finally {
      setResendBusy(false);
    }
  }

  if (verified) {
    return (
      <AuthLayout
        mode="verify"
        heroImage={heroImage}
        headline="You're in."
        text="One more step and your account is live. Every drop, every drop alert, waiting for you."
        title="Email verified"
        subtitle="Your address is confirmed — sign in to continue."
      >
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
        >
          Email verified successfully. Taking you to the sign-in page...
        </div>

        <button
          type="button"
          onClick={() => navigate("/login", { state: location.state, replace: true })}
          className={`${submitBtn} mt-4`}
        >
          Continue to sign in
          <ArrowRight size={16} />
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      mode="verify"
      heroImage={heroImage}
      headline="Built for the first rep."
      text="Join MOVE and get first access to every release, tested in our lab and made to be worn hard."
      title="Check your inbox"
      subtitle={
        email
          ? `We sent a verification code to ${email}. Enter it below to activate your account.`
          : "Enter the verification code we emailed you to activate your account."
      }
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-2.5 sm:gap-3"
      >
        <div className="grid gap-1">
          <label htmlFor="code" className={label}>
            Verification code
          </label>

          <input
            id="code"
            type="text"
            autoComplete="one-time-code"
            placeholder="Paste your code"
            className={inputCls}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <p
          role="status"
          aria-live="polite"
          className="min-h-4 text-xs font-medium text-red-500"
        >
          {msg}
        </p>

        <button type="submit" disabled={busy} className={submitBtn}>
          {busy ? "Verifying..." : "Verify email"}
          <ArrowRight size={16} />
        </button>
      </form>

      {resent && (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400"
        >
          A new code is on its way. The previous code no longer works.
        </p>
      )}

      {email ? (
        <p className="mt-3 text-center text-xs sm:text-[13px] text-neutral-500">
          Didn't get it?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendBusy}
            className="font-bold text-neutral-950 underline underline-offset-4 disabled:opacity-60 dark:text-white"
          >
            {resendBusy ? "Sending..." : "Resend code"}
          </button>
        </p>
      ) : (
        <p className="mt-3 text-center text-xs sm:text-[13px] text-neutral-500">
          No code?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup", { state: location.state })}
            className="font-bold text-neutral-950 underline underline-offset-4 dark:text-white"
          >
            Sign up again
          </button>
        </p>
      )}
    </AuthLayout>
  );
}
