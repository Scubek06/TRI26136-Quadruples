import { useState } from "react";
import { ArrowLeft, ArrowRight, Database } from "lucide-react";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f0] px-4 py-10 text-[#17211c]">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[#e0e4d9] bg-white shadow-xl md:grid-cols-2">

        {/* Left panel */}
        <section className="flex flex-col justify-between bg-[#1b2b20] p-8 text-white sm:p-12">
          <a href="/" className="flex items-center gap-3 text-xl font-extrabold">
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

        {/* Login / Signup panel */}
        <section className="p-6 sm:p-10 lg:p-12">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#566052] hover:text-[#17211c]"
          >
            <ArrowLeft size={16} /> Back to home
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
            onSubmit={(event) => {
              event.preventDefault();
              alert(
                "Authentication is not connected yet. Backend integration is required."
              );
            }}
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
                  className="w-full rounded-lg border border-[#dfe4d8] bg-[#fafbf7] px-4 py-3 text-sm outline-none transition focus:border-[#91b52d] focus:ring-2 focus:ring-[#91b52d]/20"
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
                className="w-full rounded-lg border border-[#dfe4d8] bg-[#fafbf7] px-4 py-3 text-sm outline-none transition focus:border-[#91b52d] focus:ring-2 focus:ring-[#91b52d]/20"
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
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={8}
                required
                className="w-full rounded-lg border border-[#dfe4d8] bg-[#fafbf7] px-4 py-3 text-sm outline-none transition focus:border-[#91b52d] focus:ring-2 focus:ring-[#91b52d]/20"
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
                  className="w-full rounded-lg border border-[#dfe4d8] bg-[#fafbf7] px-4 py-3 text-sm outline-none transition focus:border-[#91b52d] focus:ring-2 focus:ring-[#91b52d]/20"
                />
              </div>
            )}

            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-3 rounded-lg bg-[#17291d] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#304333] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#719d22]"
            >
              {isSignup ? "Create account" : "Log in"}
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[#687365]">
            {isSignup
              ? "Already have an account?"
              : "New to DataPilot AI?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignup((current) => !current)}
              className="font-bold text-[#547525] underline-offset-4 hover:underline"
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
