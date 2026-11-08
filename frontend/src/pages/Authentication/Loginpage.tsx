
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import AuthLayout, { inputCls } from "./Authlayout";
import PasswordInput from "./Passwordinput";
import { loginRequest } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";

const heroImage = "/images/auth-hero.png";

type LoginForm = {
  email: string;
  password: string;
  remember: boolean;
};

type LoginPageProps = {
  onSubmit?: (form: LoginForm) => Promise<void>;
};

const label = "text-xs sm:text-[13px] font-medium";

const submitBtn =
  "group flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 py-3 sm:py-3.5 text-sm font-semibold text-white transition hover:gap-3 active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-950";

export default function LoginPage({ onSubmit }: LoginPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  // Where a ProtectedRoute guard sent us from (e.g. /checkout) — return there
  // after a successful sign-in instead of always going home.
  const from = (
    location.state as { from?: { pathname?: string; search?: string } } | null
  )?.from;
  const returnTo = from?.pathname
    ? `${from.pathname}${from.search ?? ""}`
    : "/";

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
    remember: true,
  });

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const update =
    (key: keyof LoginForm) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [key]:
          e.target.type === "checkbox"
            ? e.target.checked
            : e.target.value,
      }));
    };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setMsg("Enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      setMsg("Your password needs at least 8 characters.");
      return;
    }

    setMsg("");
    setBusy(true);

    try {
      if (onSubmit) {
        await onSubmit({ ...form, email: form.email.trim() });
      } else {
        const session = await loginRequest(form.email.trim(), form.password);
        setAuth(session);
        // Admins go to the ops console; everyone else returns to wherever the
        // guard sent them from (or the storefront).
        if (session.user.role === "ADMIN") {
          navigate("/admin", { replace: true });
          return;
        }
      }

      navigate(returnTo, { replace: true });
    } catch (err: unknown) {
      setMsg(
        err instanceof Error
          ? err.message
          : "We couldn't sign you in. Check your details and try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      mode="login"
      heroImage={heroImage}
      headline="Move without limits."
      text="Engineered for pure motion, peak output, and everyday intensity. Welcome to your athletic inner circle."
      title="Welcome back"
      subtitle="Sign in to see your orders, member perks, and priority releases."
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-3 sm:gap-4"
      >
        <div className="grid gap-1.5">
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

        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="password" className={label}>
              Password
            </label>

            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs text-neutral-500 transition hover:text-neutral-950 dark:hover:text-white"
            >
              Forgot password?
            </button>
          </div>

          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={update("password")}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs sm:text-[13px] text-neutral-500">
          <input
            type="checkbox"
            className="size-4 rounded accent-neutral-950 dark:accent-white"
            checked={form.remember}
            onChange={update("remember")}
          />
          Remember me for 30 days
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
          {busy ? "Signing in..." : "Sign in"}
          <ArrowRight size={16} />
        </button>
      </form>

      <p className="mt-4 text-center text-xs sm:text-[13px] text-neutral-500">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={() => navigate("/signup", { state: location.state })}
          className="font-bold text-neutral-950 underline underline-offset-4 dark:text-white"
        >
          Join MOVE
        </button>
      </p>
    </AuthLayout>
  );
}
