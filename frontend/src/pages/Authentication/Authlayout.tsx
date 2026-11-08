
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const inputCls =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition " +
  "placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/10 " +
  "dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:focus:border-white dark:focus:ring-white/10";

const display =
  "font-['Archivo'] font-black italic tracking-tight [font-stretch:125%]";

type AuthLayoutProps = {
  // "verify" highlights neither tab: the user is between signup and login.
  mode: "login" | "signup" | "verify";
  heroImage?: string;
  headline: string;
  text: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function AuthLayout({
  mode,
  heroImage,
  headline,
  text,
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Keep a guarded-route redirect (state.from) when switching auth tabs.
  const go = (path: string) => navigate(path, { state: location.state });

  return (
    <main className="min-h-screen bg-white font-['Space_Grotesk'] dark:bg-black md:grid md:place-items-center md:p-4">

      <div className="mx-auto grid min-h-screen w-full max-w-[1100px] overflow-hidden bg-white dark:bg-neutral-950 md:min-h-[680px] md:grid-cols-2 md:rounded-[24px] md:shadow-2xl">

        {/* LEFT: HERO SECTION - Desktop and tablet */}
        <section
          className="relative hidden flex-col justify-between overflow-hidden bg-black bg-cover bg-center p-8 text-white md:flex lg:p-11"
          style={{
            backgroundImage: heroImage
              ? `url(${heroImage})`
              : undefined,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/90" />

          <div className="relative flex items-center justify-between">
            <span className={`text-3xl ${display}`}>MOVE</span>

            <span className="rounded-full border border-white/40 px-3 py-1.5 text-xs">
              Member portal
            </span>
          </div>

          <div className="relative max-w-lg">
            <span className="inline-block rounded-sm bg-white px-2 py-1 text-[10px] font-bold text-black">
              MOVE ATHLETIC
            </span>

            <h2 className={`my-5 text-5xl leading-[.95] lg:text-6xl ${display}`}>
              {headline}
            </h2>

            <p className="max-w-[34ch] text-sm leading-relaxed text-white/75 lg:text-base">
              {text}
            </p>

            <div className="mt-9 border-t border-white/20 pt-4 text-xs text-white/60">
              MOVE Athletic Lab
            </div>
          </div>
        </section>

        {/* RIGHT: AUTH SECTION */}
        <section className="flex min-h-screen flex-col justify-center px-5 py-8 text-neutral-950 dark:text-white sm:px-10 md:min-h-0 md:px-10 md:py-10 lg:px-14">

          {/* Mobile brand */}
          <div className={`mb-8 text-3xl md:hidden ${display}`}>
            MOVE
          </div>

          <div className="mx-auto w-full max-w-[420px]">

            {/* Heading */}
            <div className="mb-5">
              <h1 className={`text-3xl leading-none sm:text-4xl ${display}`}>
                {title}
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                {subtitle}
              </p>
            </div>

            {/* Functional tabs */}
            <div
              className="mb-5 grid grid-cols-2 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-900"
              role="tablist"
              aria-label="Authentication"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                onClick={() => go("/login")}
                className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                  mode === "login"
                    ? "bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-500 hover:text-neutral-950 dark:hover:text-white"
                }`}
              >
                Sign in
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={mode === "signup"}
                onClick={() => go("/signup")}
                className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                  mode === "signup"
                    ? "bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-500 hover:text-neutral-950 dark:hover:text-white"
                }`}
              >
                Create account
              </button>
            </div>

            {/* Login / Signup form */}
            {children}

            <p className="mt-5 text-center text-[11px] text-neutral-400">
              © {new Date().getFullYear()} MOVE. All rights reserved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
