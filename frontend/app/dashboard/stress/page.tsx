"use client";

import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import axios from "axios";
import { auth } from "@/lib/firebase";
import Link from "next/link";

type StressEntry = {
  id: number;
  stress_date: string;
  stress_level: number;
  trigger: string | null;
  note: string | null;
  recorded_at: string;
};

export default function StressPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [stressDate, setStressDate] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [trigger, setTrigger] = useState("");
  const [note, setNote] = useState("");

  const [entries, setEntries] = useState<StressEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadStressEntries();
    }
  }, [user]);

  async function loadStressEntries() {
    try {
      setLoadingEntries(true);
      setError("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        return;
      }

      const token = await currentUser.getIdToken();

      const response = await axios.get(
        "http://localhost:5000/api/stress",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEntries(response.data);
    } catch (error) {
      console.error("Error loading stress entries:", error);
      setError("Unable to load your stress records.");
    } finally {
      setLoadingEntries(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!stressDate) {
      setError("Please select a date.");
      return;
    }

    if (!stressLevel) {
      setError("Please select your stress level.");
      return;
    }

    const level = Number(stressLevel);

    if (!Number.isInteger(level) || level < 1 || level > 10) {
      setError("Stress level must be between 1 and 10.");
      return;
    }

    try {
      setSaving(true);

      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError("You are not logged in.");
        return;
      }

      const token = await currentUser.getIdToken();

      await axios.post(
        "http://localhost:5000/api/stress",
        {
          stress_date: stressDate,
          stress_level: level,
          trigger: trigger.trim() || null,
          note: note.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Stress record saved successfully.");

      setStressLevel("");
      setTrigger("");
      setNote("");

      await loadStressEntries();
    } catch (error) {
      console.error("Error saving stress entry:", error);

      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.error ||
            "Unable to save your stress record."
        );
      } else {
        setError("Unable to save your stress record.");
      }
    } finally {
      setSaving(false);
    }
  }

  function getStressLabel(level: number) {
    if (level <= 2) return "Very low";
    if (level <= 4) return "Low";
    if (level <= 6) return "Moderate";
    if (level <= 8) return "High";
    return "Very high";
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="mt-4 text-sm text-slate-600">
            Checking your account...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-bold text-slate-900">
              MindTrack AI
            </p>

            <p className="text-xs text-slate-500">
              Student Wellbeing & Productivity
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-indigo-600">
            Stress Tracking
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Track your stress
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Record your stress levels and identify possible triggers over time.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Record Stress */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Record stress
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              How are you feeling today?
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Date
                </label>

                <input
                  type="date"
                  value={stressDate}
                  onChange={(e) => setStressDate(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Stress level
                </label>

                <select
                  value={stressLevel}
                  onChange={(e) => setStressLevel(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Select stress level</option>

                  <option value="1">1 — Very low</option>
                  <option value="2">2 — Very low</option>
                  <option value="3">3 — Low</option>
                  <option value="4">4 — Low</option>
                  <option value="5">5 — Moderate</option>
                  <option value="6">6 — Moderate</option>
                  <option value="7">7 — High</option>
                  <option value="8">8 — High</option>
                  <option value="9">9 — Very high</option>
                  <option value="10">10 — Very high</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Possible trigger
                </label>

                <input
                  type="text"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  placeholder="e.g. University work, exams, work, relationships"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Note
                </label>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="Tell us more about how you're feeling..."
                  className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Stress Record"}
              </button>
            </form>
          </section>

          {/* Stress History */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Stress history
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your previous stress records.
            </p>

            {loadingEntries ? (
              <div className="mt-8 text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading your records...
                </p>
              </div>
            ) : entries.length === 0 ? (
              <div className="mt-8 rounded-xl bg-slate-50 p-6 text-center">
                <div className="text-4xl">🧠</div>

                <p className="mt-3 text-sm font-medium text-slate-700">
                  No stress records yet
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Add your first stress record using the form.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {entry.stress_date}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {getStressLabel(entry.stress_level)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-600">
                          {entry.stress_level}
                        </p>

                        <p className="text-xs text-slate-400">
                          / 10
                        </p>
                      </div>
                    </div>

                    {entry.trigger && (
                      <div className="mt-4">
                        <p className="text-xs text-slate-400">
                          Possible trigger
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {entry.trigger}
                        </p>
                      </div>
                    )}

                    {entry.note && (
                      <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        {entry.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}