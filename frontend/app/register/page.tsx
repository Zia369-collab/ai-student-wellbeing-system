"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
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

    if (!acceptedTerms) {
      setError("Please accept the terms before creating your account.");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, {
  displayName: name.trim(),
});

// Get the Firebase ID token
const token = await userCredential.user.getIdToken();

// Create the user in PostgreSQL
const response = await fetch("http://localhost:5000/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    display_name: name.trim(),
  }),
});

if (!response.ok) {
  throw new Error("Failed to create user in database");
}

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
          case "auth/email-already-in-use":
            setError("An account with this email already exists.");
            break;

          case "auth/invalid-email":
            setError("Please enter a valid email address.");
            break;

          case "auth/weak-password":
            setError("Please choose a stronger password.");
            break;

          default:
            setError("Unable to create your account. Please try again.");
        }
      } else {
        setError("Unable to create your account. Please try again.");
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
              Start your journey
            </p>

            <h1 className="text-5xl font-bold leading-tight text-white">
              Build better habits.
              <span className="block text-indigo-200">
                Understand your wellbeing.
              </span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-indigo-100">
              Track your wellbeing and productivity while discovering
              patterns that can help you build healthier study routines.
            </p>
          </div>

          <p className="text-sm text-indigo-200">
            AI-Powered Student Wellbeing & Productivity Tracking System
          </p>
        </section>

        {/* Right side */}
        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

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
                  Create your account
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Start tracking your wellbeing and productivity.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">

                {/* Full name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

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
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Use at least 8 characters.
                  </p>
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Confirm password
                  </label>

                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) =>
                      setAcceptedTerms(event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />

                  <label
                    htmlFor="terms"
                    className="text-sm leading-5 text-slate-600"
                  >
                    I agree to use this platform responsibly and understand
                    that its AI recommendations are not medical advice.
                  </label>
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

                {/* Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <div className="mt-8 border-t border-slate-200 pt-6 text-center">
                <p className="text-sm text-slate-600">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Sign in
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