
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import AuthLayout, { inputCls } from "./Authlayout";
import PasswordInput from "./Passwordinput";
import { signupRequest } from "../../lib/api";

const heroImage = "/images/auth-hero.png";

type SignupForm = {
  name: string;
  email: string;
  password: string;
};

type SignupPageProps = {
  onSubmit?: (form: SignupForm) => Promise<void>;
};

const label = "text-xs sm:text-[13px] font-medium";

const submitBtn =
  "group flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 py-3 sm:py-3.5 text-sm font-semibold text-white transition hover:gap-3 active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-950";

const strengthWords = [
  "Too short",
  "Weak",
  "Okay",
  "Strong",
  "Very strong",
];

const strengthOf = (value: string): number =>
  [
    value.length >= 8,
    /[a-z]/.test(value) && /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;

export default function SignupPage({ onSubmit }: SignupPageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    terms: false,
  });

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const update =
    (key: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [key]:
          e.target.type === "checkbox"
            ? e.target.checked
            : e.target.value,
      }));
    };

  const strength = strengthOf(form.password);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.name.trim()) {
      setMsg("Enter your full name.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setMsg("Enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      setMsg("Your password needs at least 8 characters.");
      return;
    }

    if (!form.terms) {
      setMsg("Please accept the terms to create your account.");
      return;
    }

    setMsg("");
    setBusy(true);

    try {
      if (onSubmit) {
        await onSubmit({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      } else {
        // Signup creates no auth state (no session yet), so no store update
        await signupRequest({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      }

      // No login yet — send the code to /verify, carrying the guarded-route
      // redirect (state.from) and the email the resend endpoint needs.
      navigate("/verify", {
        state: { ...location.state, email: form.email.trim() },
      });
    } catch (err: unknown) {
      setMsg(
        err instanceof Error
          ? err.message
          : "We couldn't create your account. Try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      mode="signup"
      heroImage={heroImage}
      headline="Built for the first rep."
      text="Join MOVE and get first access to every release, tested in our lab and made to be worn hard."
      title="Join the circle"
      subtitle="Create your free account for early drops, member pricing, and free returns."
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-2.5 sm:gap-3"
      >
        <div className="grid gap-1">
          <label htmlFor="name" className={label}>
            Full name
          </label>

          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Alex Vance"
            className={inputCls}
            value={form.name}
            onChange={update("name")}
          />
        </div>

        <div className="grid gap-1">
          <label htmlFor="email" className={label}>
            Email address
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={inputCls}
            value={form.email}
            onChange={update("email")}
          />
        </div>

        <div className="grid gap-1">
          <label htmlFor="password" className={label}>
            Password
          </label>

          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={form.password}
            onChange={update("password")}
          />

          <div className="mt-1 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-[3px] flex-1 rounded-full transition-colors ${
                  i < strength
                    ? "bg-neutral-950 dark:bg-white"
                    : "bg-neutral-200 dark:bg-neutral-800"
                }`}
              />
            ))}
          </div>

          <p className="text-[11px] text-neutral-500">
            {form.password
              ? strengthWords[strength]
              : "Use 8+ characters with a number and a symbol."}
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-xs leading-snug text-neutral-500">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 rounded accent-neutral-950 dark:accent-white"
            checked={form.terms}
            onChange={update("terms")}
          />
          <span>
            I agree to the Terms of Service and want early access to drops by email.
          </span>
        </label>

        <p
          role="status"
          aria-live="polite"
          className="min-h-4 text-xs font-medium text-red-500"
        >
          {msg}
        </p>

        <button
          type="submit"
          disabled={busy}
          className={submitBtn}
        >
          {busy ? "Creating account..." : "Create account"}
          <ArrowRight size={16} />
        </button>
      </form>

      <p className="mt-3 text-center text-xs sm:text-[13px] text-neutral-500">
        Already a member?{" "}
        <button
          type="button"
          onClick={() => navigate("/login", { state: location.state })}
          className="font-bold text-neutral-950 underline underline-offset-4 dark:text-white"
        >
          Sign in
        </button>
      </p>
    </AuthLayout>
  );
}
