"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      router.push("/dashboard");
    } catch (error: unknown) {
      console.error(error);

      if (
        error &&
        typeof error === "object" &&
        "code" in error
      ) {
        const firebaseError = error as { code: string };

        switch (firebaseError.code) {
          case "auth/invalid-credential":
          case "auth/wrong-password":
          case "auth/user-not-found":
            setError("Incorrect email or password.");
            break;

          case "auth/invalid-email":
            setError("Please enter a valid email address.");
            break;

          case "auth/too-many-requests":
            setError(
              "Too many unsuccessful attempts. Please try again later."
            );
            break;

          default:
            setError("Unable to sign in. Please try again.");
        }
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* Left side */}
        <section className="hidden bg-indigo-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div>
            <Link
              href="/"
              className="flex items-center gap-3 text-white"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-indigo-600">
                M
              </div>

              <span className="text-xl font-bold">
                MindTrack AI
              </span>
            </Link>
          </div>

          <div className="max-w-lg">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-indigo-200">
              Welcome back
            </p>

            <h1 className="text-5xl font-bold leading-tight text-white">
              Understand yourself.
              <span className="block text-indigo-200">
                Improve every day.
              </span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-indigo-100">
              Continue tracking your wellbeing, understanding your habits,
              and building healthier study routines.
            </p>
          </div>

          <p className="text-sm text-indigo-200">
            AI-Powered Student Wellbeing & Productivity Tracking System
          </p>
        </section>

        {/* Right side */}
        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <Link
              href="/"
              className="mb-10 flex items-center justify-center gap-3 lg:hidden"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
                M
              </div>

              <span className="text-xl font-bold text-slate-900">
                MindTrack AI
              </span>
            </Link>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">

              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Sign in to continue tracking your wellbeing.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                {/* Login button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              {/* Register */}
              <div className="mt-8 border-t border-slate-200 pt-6 text-center">
                <p className="text-sm text-slate-600">
                  Don't have an account?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              Your wellbeing data should be treated with care and respect.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}