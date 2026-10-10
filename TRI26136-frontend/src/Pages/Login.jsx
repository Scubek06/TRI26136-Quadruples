
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Database } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const destination =
    location.state?.from?.pathname || "/dashboard";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") || "");
    const confirmPassword = String(
      form.get("confirmPassword") || ""
    );

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (isSignup) {
      if (!name) {
        setError("Please enter your full name.");
        return;
      }

      if (password.length < 8) {
        setError("Password must contain at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignup) {
        const { data, error: authError } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name,
              },
            },
          });

        if (authError) {
          const errorMessage = authError.message.toLowerCase();

          if (
            errorMessage.includes("already registered") ||
            errorMessage.includes("already exists") ||
            errorMessage.includes("already been registered") ||
            errorMessage.includes("user already registered")
          ) {
            setIsSignup(false);
            setError(
              "User already exists. Please log in with your account."
            );
            return;
          }

          throw authError;
        }

        // With email confirmation disabled, Supabase should
        // return a session for a successful signup.
        if (data.session) {
            navigate(destination, { replace: true });
                return;
        }

        // Supabase can intentionally hide duplicate-account
        // information when email confirmation is enabled.
        setMessage(
          "If this email is eligible for registration, check your inbox for a confirmation link. If you already have an account, please log in."
        );
      } else {
        const { data, error: authError } =
            await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
          if (
            authError.message
              .toLowerCase()
              .includes("email not confirmed")
          ) {
            setError(
              "Please confirm your email using the link sent to your inbox."
            );
          } else {
            setError(
              "Invalid email or password. Please try again."
            );
          }

          return;
        }

        if (data.session) {
  navigate(destination, { replace: true });
} else {
  setError("Login succeeded, but no active session was created.");
}
      }
    } catch (err) {
      console.error("Authentication error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setIsSignup((current) => !current);
    setError("");
    setMessage("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f0] px-4 py-10 text-[#17211c]">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[#e0e4d9] bg-white shadow-xl md:grid-cols-2">
        <section className="flex flex-col justify-between bg-[#1b2b20] p-8 text-white sm:p-12">
          <a
            href="/"
            className="flex items-center gap-3 text-xl font-extrabold"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d8fa68] text-[#17211c]">
              <Database size={21} />
            </span>
            datapilot <span className="text-[#d8fa68]">AI</span>
          </a>

          <div className="py-12">
            <p className="mb-4 font-mono text-xs uppercase tracking-[2px] text-[#d8fa68]">
              Your data journey starts here
            </p>

            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Turn your data into your next insight.
            </h1>

            <p className="mt-5 max-w-sm leading-7 text-white/70">
              Bring your datasets together and discover a clearer way to
              understand your data.
            </p>
          </div>

          <p className="text-xs text-white/50">
            © 2026 DataPilot AI · Hackathon MVP
          </p>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#566052] hover:text-[#17211c]"
          >
            <ArrowLeft size={16} />
            Back to home
          </a>

          <div className="mt-10">
            <h2 className="text-3xl font-bold tracking-tight">
              {isSignup ? "Create your account" : "Welcome back"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#687365]">
              {isSignup
                ? "Sign up to get started with your data workspace."
                : "Log in to continue to your DataPilot workspace."}
            </p>
          </div>

          <form
            className="mt-8 space-y-5"
            onSubmit={handleSubmit}
          >
            {isSignup && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Full name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-[#dfe4d8] bg-[#fafbf7] px-4 py-3 text-sm outline-none transition focus:border-[#91b52d] focus:ring-2 focus:ring-[#91b52d]/20 disabled:opacity-60"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={loading}
                className="w-full rounded-lg border border-[#dfe4d8] bg-[#fafbf7] px-4 py-3 text-sm outline-none transition focus:border-[#91b52d] focus:ring-2 focus:ring-[#91b52d]/20 disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                autoComplete={
                  isSignup ? "new-password" : "current-password"
                }
                minLength={isSignup ? 8 : undefined}
                required
                disabled={loading}
                className="w-full rounded-lg border border-[#dfe4d8] bg-[#fafbf7] px-4 py-3 text-sm outline-none transition focus:border-[#91b52d] focus:ring-2 focus:ring-[#91b52d]/20 disabled:opacity-60"
              />
            </div>

            {isSignup && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-[#dfe4d8] bg-[#fafbf7] px-4 py-3 text-sm outline-none transition focus:border-[#91b52d] focus:ring-2 focus:ring-[#91b52d]/20 disabled:opacity-60"
                />
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {message && (
              <p
                role="status"
                className="rounded-lg bg-green-50 p-3 text-sm text-green-800"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-lg bg-[#17291d] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#304333] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#719d22] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : isSignup
                  ? "Create account"
                  : "Log in"}

              {!loading && (
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[#687365]">
            {isSignup
              ? "Already have an account?"
              : "New to DataPilot AI?"}{" "}
            <button
              type="button"
              disabled={loading}
              onClick={switchMode}
              className="font-bold text-[#547525] underline-offset-4 hover:underline disabled:opacity-60"
            >
              {isSignup ? "Log in" : "Create an account"}
            </button>
          </p>

          <p className="mt-8 text-center text-xs leading-5 text-[#879080]">
            By continuing, you agree to use DataPilot AI responsibly.
          </p>
        </section>
      </div>
    </main>
  );
}
